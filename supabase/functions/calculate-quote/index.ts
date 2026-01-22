import { serve } from 'std/http/server';
import { createClient } from 'supabase';
import { z } from 'zod';
import { CalculationEngine, type InventoryItemMaster } from '../_shared/calculation-logic.ts';

// ==========================================
// CONFIGURATION & CACHE
// ==========================================

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
let cachedInventory: InventoryItemMaster[] | null = null;
let lastFetchTime = 0;

// ==========================================
// SECURITY: Dynamic CORS based on partner domain whitelist
// ==========================================

function getCorsHeaders(origin: string | null, isAllowed: boolean): Record<string, string> {
    // If origin is allowed, reflect it; otherwise use restrictive default
    const allowedOrigin = isAllowed && origin ? origin : 'null';

    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers':
            'authorization, x-client-info, apikey, content-type, x-api-key',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
    };
}

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const RequestSchema = z.object({
    facility_type: z.string(),
    area: z.number().min(10, 'Area must be at least 10 sqm'),
    intensity_level: z
        .enum(['low', 'medium', 'high', 'very_high', 'critical'])
        .optional()
        .default('medium'),
    daily_visitors: z.number().optional().default(0),
    staff_count: z.number().optional().default(0),
    save_lead: z.boolean().optional().default(false),
    client_email: z.string().email().optional(),
    client_phone: z.string().optional(),
    zones: z
        .array(
            z.object({
                name: z.string(),
                type: z.string(),
                area: z.number(),
                staff_count: z.number().optional().default(0),
                priority: z.enum(['critical', 'standard', 'low']).optional().default('standard'),
                color: z.string(),
            })
        )
        .min(1, 'At least one zone is required'),
});

// ==========================================
// HELPERS
// ==========================================

async function hashApiKey(key: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate origin against partner's allowed domains
 */
function isOriginAllowed(origin: string | null, allowedDomains: string[] | null): boolean {
    // No origin = server-side request, allow
    if (!origin) return true;

    // No domain restrictions = allow all
    if (!allowedDomains || allowedDomains.length === 0) return true;

    try {
        // Extract domain from origin
        const url = new URL(origin);
        const originDomain = url.hostname.toLowerCase();

        for (const allowed of allowedDomains) {
            const allowedLower = allowed.toLowerCase();
            // Exact match or subdomain match
            if (originDomain === allowedLower || originDomain.endsWith('.' + allowedLower)) {
                return true;
            }
        }
    } catch {
        // Invalid origin URL
        return false;
    }

    return false;
}

// ==========================================
// MAIN HANDLER
// ==========================================

serve(async (req: Request) => {
    const origin = req.headers.get('origin');

    // For preflight, we need to check partner from query param or be permissive
    // Since we can't know the partner yet, allow preflight but validate on actual request
    if (req.method === 'OPTIONS') {
        // Preflight: Allow wide CORS for OPTIONS, actual validation on POST
        return new Response('ok', {
            headers: getCorsHeaders(origin, true),
        });
    }

    // Default restrictive headers until we validate
    let corsHeaders = getCorsHeaders(origin, false);

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Authenticate Partner via API Key
        const apiKey = req.headers.get('x-api-key');
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Missing x-api-key header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const hashedKey = await hashApiKey(apiKey);
        const { data: partner, error: partnerError } = await supabase
            .from('partners')
            .select('*')
            .eq('api_key_hash', hashedKey)
            .eq('is_active', true)
            .single();

        if (partnerError || !partner) {
            console.error('Auth error:', partnerError);
            return new Response(JSON.stringify({ error: 'Invalid or inactive API key' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 2. SECURITY: Validate Origin against partner's allowed domains
        const originAllowed = isOriginAllowed(origin, partner.allowed_domains);
        if (!originAllowed) {
            console.warn(`Origin rejected for partner ${partner.id}: ${origin}`);
            return new Response(
                JSON.stringify({
                    error: 'Origin not allowed',
                    error_code: 'DOMAIN_NOT_ALLOWED',
                }),
                {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Update CORS headers now that we know the origin is valid
        corsHeaders = getCorsHeaders(origin, true);

        // 3. SECURITY: Rate Limit Check
        if (partner.request_count >= partner.rate_limit_quota) {
            console.warn(`Rate limit exceeded for partner ${partner.id}`);
            return new Response(
                JSON.stringify({
                    error: 'Rate limit exceeded',
                    error_code: 'RATE_LIMIT_EXCEEDED',
                    retry_after: 'Contact support to increase quota',
                }),
                {
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // 4. Validate Payload
        const body = await req.json();
        const validation = RequestSchema.safeParse(body);
        if (!validation.success) {
            return new Response(
                JSON.stringify({ error: 'Validation failed', details: validation.error.format() }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        const data = validation.data;

        // Business Logic Validation: Sum of zone areas should not exceed total area (approx)
        const totalZoneArea = data.zones.reduce(
            (sum: number, z: { area: number }) => sum + z.area,
            0
        );
        if (totalZoneArea > data.area * 1.5) {
            return new Response(
                JSON.stringify({
                    error: 'Sum of zone areas exceeds total facility area significantly',
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // 5. Load Inventory (Cached)
        const now = Date.now();
        if (!cachedInventory || now - lastFetchTime > CACHE_TTL) {
            const { data: inventory, error: invError } = await supabase
                .from('v_inventory_calculation')
                .select('*');

            if (invError) throw invError;
            cachedInventory = inventory as unknown as InventoryItemMaster[];
            lastFetchTime = now;
            console.log('Inventory cache refreshed.');
        }

        if (!cachedInventory) {
            throw new Error('Failed to load inventory');
        }

        // 6. Execute Calculation
        const zones = data.zones.map(
            (
                z: {
                    name: string;
                    type: string;
                    area: number;
                    staff_count: number;
                    color: string;
                    priority: string;
                },
                idx: number
            ) => ({
                id: `z-${idx}`,
                name: z.name,
                type: z.type,
                area: String(z.area),
                staffCount: String(z.staff_count),
                color: z.color,
                priority: z.priority as 'standard' | 'critical' | 'low',
            })
        );

        const objectData = {
            staffCount: String(data.staff_count),
            dailyVisitors: String(data.daily_visitors),
            intensityLevel: data.intensity_level,
        };

        const estimate = CalculationEngine.calculateInventory(zones, objectData, cachedInventory);

        // 7. Update partner usage stats
        await supabase
            .from('partners')
            .update({
                request_count: partner.request_count + 1,
                last_request_at: new Date().toISOString(),
            })
            .eq('id', partner.id);

        // 8. Save Lead if requested
        if (data.save_lead) {
            const { error: leadError } = await supabase.from('partner_leads').insert({
                partner_id: partner.id,
                facility_type: data.facility_type,
                area: data.area,
                estimated_total: estimate.grandTotal,
                client_email: data.client_email,
                client_phone: data.client_phone,
                full_data: {
                    input: data,
                    results: {
                        totalGoods: estimate.totalGoods,
                        totalDelivery: estimate.totalDelivery,
                        totalVat: estimate.totalVat,
                    },
                },
            });

            if (leadError) {
                console.error('Failed to save lead:', leadError);
                // We don't fail the whole request if lead saving fails
            }
        }

        // 9. Success Response
        return new Response(
            JSON.stringify({
                estimated_total: estimate.grandTotal,
                currency: 'RUB',
                detailed_summary: estimate.summary.map((item) => ({
                    name: item.inventory,
                    sku: item.sku,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total,
                })),
                breakdown: {
                    goods: estimate.totalGoods,
                    delivery: estimate.totalDelivery,
                    vat: estimate.totalVat,
                },
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (err: unknown) {
        const error = err as Error;
        console.error('API Error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal Server Error', message: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
