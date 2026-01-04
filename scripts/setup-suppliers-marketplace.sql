-- PROFESSIONAL HORECA MARKETPLACE: Industry Leaders & Expert Inventory
-- This script seeds the database with the REAL standard of HoReCa supplies

-- 1. Create Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo TEXT,
    rating DECIMAL DEFAULT 0,
    contacts JSONB DEFAULT '{}'::jsonb,
    integration_type VARCHAR(50) DEFAULT 'internal',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add Supplier ID to Inventory Items
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='inventory_items' AND column_name='supplier_id') THEN
        ALTER TABLE public.inventory_items ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. ENABLE RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active suppliers" ON public.suppliers;
CREATE POLICY "Anyone can view active suppliers" ON public.suppliers FOR SELECT USING (status = 'active');

-- 4. SEED DATA: Industry Leaders (Standard UUIDs for internal mapping)
INSERT INTO public.suppliers (id, name, description, logo, rating, integration_type, status)
VALUES 
    ('33333333-3333-3333-3333-333333333333', 'Pro-Brite', 'Российский эксперт в производстве промышленной химии для HoReCa и пищевых производств.', 'https://pro-brite.com/assets/images/logo.png', 4.8, 'internal', 'active'),
    ('44444444-4444-4444-4444-444444444444', 'Vileda Professional', 'Мировой лидер в производстве эргономичного уборочного инвентаря для профессионалов.', 'https://www.vileda-professional.com/media/Logo_Vileda_Professional.svg', 5.0, 'api_custom', 'active'),
    ('55555555-5555-5555-5555-555555555555', 'Tork (Essity)', 'Ведущий бренд гигиенических решений: бумажные полотенца, мыло и системы дозирования.', 'https://www.tork.ru/static/logo-tork.png', 4.9, 'api_1c', 'active')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    logo = EXCLUDED.logo;

-- 5. SEED DATA: Specialized Inventory
DELETE FROM public.inventory_items;

INSERT INTO public.inventory_items 
(name, sku, color, price, stock, category, norm_area, norm_personnel, norm_intensity, replacement_cycle_days, supplier_id) 
VALUES
-- PRO-BRITE: Specialized Chemicals
('Средство для гриля "GRILL-CLEANER" (5л)', 'PB-GRIL-05', '#22c55e', 1850, 120, 'Кухонная химия', 0.1, 0, 0.5, 30, '33333333-3333-3333-3333-333333333333'),
('Концентрат для полов "PRO-FLOOR" (5л)', 'PB-FLOOR-01', '#3b82f6', 1540, 300, 'Общая химия', 0.5, 0, 0.2, 30, '33333333-3333-3333-3333-333333333333'),
('Дезинфектант "CLIN-DES" (санузлы)', 'PB-DES-02', '#ef4444', 1620, 150, 'Санитария', 0.8, 0.5, 0.4, 25, '33333333-3333-3333-3333-333333333333'),

-- VILEDA PROFESSIONAL: Expert Systems
('Система UltraSpeed Pro (Ведро+Отжим)', 'VP-USP-KIT', '#3b82f6', 12800, 40, 'Оборудование', 1.0, 0.5, 0, 730, '44444444-4444-4444-4444-444444444444'),
('МОП МикроСпид Плюс (Blue)', 'VP-MSP-B', '#3b82f6', 1450, 400, 'Инвентарь', 3.0, 2.0, 0.1, 90, '44444444-4444-4444-4444-444444444444'),
('Салфетка ПВАмикро (Green/Kitchen)', 'VP-PVA-G', '#22c55e', 480, 800, 'Расходные материалы', 0.5, 3.0, 1.0, 45, '44444444-4444-4444-4444-444444444444'),

-- TORK: Hygiene Systems
('Диспенсер полотенец Tork Matic (H1)', 'TK-H1-DISP', '#6b7280', 8500, 60, 'Системы', 1.0, 0.1, 0.05, 3650, '55555555-5555-5555-5555-555555555555'),
('Полотенца в рулонах Tork Matic', 'TK-H1-ROLL', '#6b7280', 1250, 1000, 'Бумага', 0, 0.5, 2.5, 7, '55555555-5555-5555-5555-555555555555'),
('Жидкое мыло-пена Tork (S4)', 'TK-S4-SOAP', '#6b7280', 2100, 240, 'Гигиена', 0, 1.0, 3.0, 14, '55555555-5555-5555-5555-555555555555');

-- 6. Final Permissions
GRANT SELECT ON public.suppliers TO anon, authenticated;
GRANT SELECT ON public.inventory_items TO anon, authenticated;
