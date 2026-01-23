import { type VercelRequest, type VercelResponse } from '@vercel/node';

// Proxy function to bypass CORS issues with Supabase Edge Functions
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Set CORS headers for the frontend to access this proxy
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key'
    );

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const TARGET_URL = `${SUPABASE_URL}/functions/v1/calculate-quote`;

        // Forward headers (especially x-api-key if present)
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (req.headers['x-api-key']) {
            headers['x-api-key'] = req.headers['x-api-key'] as string;
        }

        if (req.headers.authorization) {
            headers['Authorization'] = req.headers.authorization;
        }

        // 2. Server-to-Server request to Supabase (Bypasses CORS)
        const response = await fetch(TARGET_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(req.body),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[proxy-calculate] Supabase Error:', data);
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('[proxy-calculate] Server Error:', error);
        return res.status(500).json({ error: 'Internal proxy error' });
    }
}
