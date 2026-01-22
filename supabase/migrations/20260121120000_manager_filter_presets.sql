-- Helper function for handling updated_at
CREATE OR REPLACE FUNCTION public.fn_handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create manager_filter_presets table
CREATE TABLE IF NOT EXISTS public.manager_filter_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    query_params JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_default BOOLEAN DEFAULT false,
    view_type TEXT DEFAULT 'kanban' CHECK (view_type IN ('kanban', 'list', 'table')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indices
CREATE INDEX idx_filter_presets_user_id ON public.manager_filter_presets(user_id);

-- RLS
ALTER TABLE public.manager_filter_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can manage their own presets" ON public.manager_filter_presets
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to handle only one default per user
CREATE OR REPLACE FUNCTION fn_enforce_single_default_preset()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default THEN
        UPDATE public.manager_filter_presets
        SET is_default = false
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_single_default_preset
    BEFORE INSERT OR UPDATE ON public.manager_filter_presets
    FOR EACH ROW EXECUTE FUNCTION fn_enforce_single_default_preset();

-- Updated At Trigger
CREATE TRIGGER tr_manager_filter_presets_updated_at
    BEFORE UPDATE ON public.manager_filter_presets
    FOR EACH ROW EXECUTE FUNCTION fn_handle_updated_at();
