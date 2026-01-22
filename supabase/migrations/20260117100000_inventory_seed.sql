-- ============================================================
-- Migration: Inventory & Suppliers Seed
-- Description: Adds realistic suppliers and mapped inventory items for all zones.
-- ============================================================

-- 1. Insert Suppliers
INSERT INTO public.suppliers (id, name, description, logo, rating, integration_type, status)
VALUES 
(
    '33333333-3333-3333-3333-333333333333', 
    'Pro-Brite', 
    'Российский эксперт в производстве промышленной химии для HoReCa и пищевых производств.',
    '/assets/suppliers/pro-brite-logo.png', 
    4.8, 
    'internal', 
    'active'
),
(
    '44444444-4444-4444-4444-444444444444', 
    'Vileda Professional', 
    'Мировой лидер в производстве эргономичного уборочного инвентаря для профессионалов.',
    '/assets/suppliers/vileda-logo.svg', 
    5.0, 
    'api_custom', 
    'active'
),
(
    '55555555-5555-5555-5555-555555555555', 
    'Tork (Essity)', 
    'Ведущий бренд гигиенических решений: бумажные полотенца, мыло и системы дозирования.',
    '/assets/suppliers/tork-logo.png', 
    4.9, 
    'api_1c', 
    'active'
),
(
    '88888888-8888-8888-8888-888888888888', 
    'Karcher', 
    'Мировой лидер в области уборочной техники и технологий очистки.',
    'https://www.kaercher.com/media/logo.svg', 
    4.9, 
    'api_custom', 
    'active'
),
(
    '99999999-9999-9999-9999-999999999999', 
    'Kimberly-Clark', 
    'Американская корпорация, один из лидеров по производству продукции для здравоохранения и гигиены.',
    'https://www.kimberly-clark.com/-/media/images/brand-logos/kc-professional-logo.png', 
    4.7, 
    'internal', 
    'active'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    rating = EXCLUDED.rating;

-- 2. Insert Inventory Items (Mapped to Colors/Zones)
-- Colors: 
-- RED: #ef4444 (Sanitary)
-- YELLOW: #facc15 (Surfaces)
-- GREEN: #22c55e (Kitchen)
-- BLUE: #3b82f6 (General)

INSERT INTO public.inventory_items 
(id, name, sku, color, price, stock, norm_area, norm_personnel, norm_intensity, replacement_cycle_days, supplier_id, category, tier, durability, series, compliance_level)
VALUES 
-- RED ZONE (Sanitary / Risk)
(gen_random_uuid(), 'Концентрат WC-Gel Forte (5л)', 'PB-RD-01', '#ef4444', 1250, 45, 0.05, 0, 1.2, 30, '33333333-3333-3333-3333-333333333333', 'Химия', 2, 30, 'Expert Line', 'HACCP'),
(gen_random_uuid(), 'Туалетная бумага Premium T3', 'TK-RD-02', '#ef4444', 3450, 120, 0, 0.15, 1.0, 7, '55555555-5555-5555-5555-555555555555', 'Расходные материалы', 3, 7, 'Elevation', 'ISO'),
(gen_random_uuid(), 'Парогенератор SG 4/4 Basic', 'KR-RD-03', '#ef4444', 85400, 5, 0.001, 0, 1.0, 365, '88888888-8888-8888-8888-888888888888', 'Оборудование', 3, 1000, 'Professional', 'CE'),

-- GREEN ZONE (Kitchen / Bar)
(gen_random_uuid(), 'Обезжириватель Grizzly (1л)', 'PB-GR-01', '#22c55e', 480, 85, 0.08, 0, 1.5, 14, '33333333-3333-3333-3333-333333333333', 'Химия', 2, 14, 'Kitchen Pro', 'HACCP'),
(gen_random_uuid(), 'Губка абразивная PurActive', 'VL-GR-02', '#22c55e', 115, 300, 0, 0.05, 1.0, 3, '44444444-4444-4444-4444-444444444444', 'Инвентарь', 2, 3, 'Professional Sponge', 'GreenSeal'),

-- BLUE ZONE (General Areas / Office)
(gen_random_uuid(), 'Тележка уборочная Origo2', 'VL-BL-01', '#3b82f6', 42600, 12, 0.002, 0, 1.0, 730, '44444444-4444-4444-4444-444444444444', 'Оборудование', 3, 2000, 'Origo', 'ErgoDesign'),
(gen_random_uuid(), 'Протирочный материал WypAll L10', 'KC-BL-02', '#3b82f6', 1850, 240, 0.02, 0, 1.0, 1, '99999999-9999-9999-9999-999999999999', 'Расходные материалы', 2, 1, 'WypAll', 'EPA'),

-- YELLOW ZONE (Bathrooms / Surfaces)
(gen_random_uuid(), 'Средство для зеркал Gloss (0.75л)', 'PB-YL-01', '#facc15', 310, 150, 0.01, 0, 1.0, 60, '33333333-3333-3333-3333-333333333333', 'Химия', 1, 60, 'Home & Office', 'Standard'),
(gen_random_uuid(), 'Салфетка из микрофибры MicroClean', 'VL-YL-02', '#facc15', 280, 450, 0, 0.02, 1.0, 90, '44444444-4444-4444-4444-444444444444', 'Инвентарь', 2, 90, 'Microfiber Pro', 'Ecolabel'),

-- PINK ZONE (Spec Sanitary)
(gen_random_uuid(), 'Диспенсер мыла-пены Aquarius', 'KC-PN-01', '#ec4899', 4200, 30, 0, 0, 1.0, 1825, '99999999-9999-9999-9999-999999999999', 'Оборудование', 3, 1800, 'Aquarius', 'CE'),

-- ORANGE ZONE (Allergens)
(gen_random_uuid(), 'Ведро 10л оранжевое (HACCP)', 'VL-OR-01', '#f97316', 1850, 40, 0.01, 0, 1.0, 365, '44444444-4444-4444-4444-444444444444', 'Инвентарь', 2, 365, 'ColorCode', 'HACCP'),

-- BROWN ZONE (Ready Meat)
(gen_random_uuid(), 'Дезинфектор для поверхностей Sept-1', 'PB-BR-01', '#78350f', 890, 60, 0.05, 0, 1.2, 30, '33333333-3333-3333-3333-333333333333', 'Химия', 2, 30, 'FoodSafe', 'HACCP'),

-- WHITE ZONE (Dairy)
(gen_random_uuid(), 'Средство на основе молочной кислоты', 'PB-WT-01', '#f8fafc', 750, 55, 0.05, 0, 1.1, 30, '33333333-3333-3333-3333-333333333333', 'Химия', 2, 30, 'Dairyline', 'HACCP')
ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    stock = EXCLUDED.stock,
    updated_at = NOW();
