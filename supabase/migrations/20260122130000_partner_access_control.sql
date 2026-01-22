-- ============================================================
-- SECURITY: Partner Access Control Infrastructure
-- ============================================================
-- Adds domain whitelisting capability for enterprise partners
-- ============================================================

-- 1. Add allowed_domains column to partners table
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS allowed_domains TEXT[] DEFAULT '{}';

-- Comment for documentation
COMMENT ON COLUMN public.partners.allowed_domains IS 
'Array of allowed domains that can embed this partner''s calculator. Empty array = allow all domains.';

-- 2. Add usage tracking columns
ALTER TABLE public.partners
ADD COLUMN IF NOT EXISTS request_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_request_at TIMESTAMPTZ;

-- 3. Create function to validate partner access
CREATE OR REPLACE FUNCTION public.validate_partner_access(
    p_partner_id UUID,
    p_origin TEXT DEFAULT NULL
)
RETURNS TABLE (
    is_valid BOOLEAN,
    partner_name TEXT,
    error_code TEXT,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_partner public.partners%ROWTYPE;
    v_domain_allowed BOOLEAN;
BEGIN
    -- Find partner
    SELECT * INTO v_partner 
    FROM public.partners 
    WHERE id = p_partner_id;
    
    -- Partner not found
    IF v_partner.id IS NULL THEN
        RETURN QUERY SELECT 
            FALSE::BOOLEAN,
            NULL::TEXT,
            'PARTNER_NOT_FOUND'::TEXT,
            'Invalid partner identifier'::TEXT;
        RETURN;
    END IF;
    
    -- Partner inactive
    IF NOT v_partner.is_active THEN
        RETURN QUERY SELECT 
            FALSE::BOOLEAN,
            v_partner.name,
            'PARTNER_INACTIVE'::TEXT,
            'Partner access has been suspended'::TEXT;
        RETURN;
    END IF;
    
    -- Domain validation (if domains are specified)
    IF array_length(v_partner.allowed_domains, 1) > 0 AND p_origin IS NOT NULL THEN
        v_domain_allowed := FALSE;
        
        -- Check if origin matches any allowed domain
        FOR i IN 1..array_length(v_partner.allowed_domains, 1) LOOP
            IF p_origin LIKE '%' || v_partner.allowed_domains[i] || '%' THEN
                v_domain_allowed := TRUE;
                EXIT;
            END IF;
        END LOOP;
        
        IF NOT v_domain_allowed THEN
            RETURN QUERY SELECT 
                FALSE::BOOLEAN,
                v_partner.name,
                'DOMAIN_NOT_ALLOWED'::TEXT,
                'This domain is not authorized to use this embed'::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- Update usage stats (fire and forget)
    UPDATE public.partners 
    SET request_count = request_count + 1,
        last_request_at = NOW()
    WHERE id = p_partner_id;
    
    -- Success
    RETURN QUERY SELECT 
        TRUE::BOOLEAN,
        v_partner.name,
        NULL::TEXT,
        NULL::TEXT;
END;
$$;

-- Grant execute to anon (for public embed access validation)
GRANT EXECUTE ON FUNCTION public.validate_partner_access(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_partner_access(UUID, TEXT) TO authenticated;
