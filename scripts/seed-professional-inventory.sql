-- PROFESSIONAL HORECA INVENTORY SCHEMA & DATA (BICSc + ISO 18406 compliant)
-- This script prepares the database for the advanced calculation engine v3.0

-- 1. Ensuring correct table structure
DO $$ 
BEGIN
    ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS norm_area DECIMAL DEFAULT 0;
    ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS norm_personnel DECIMAL DEFAULT 0;
    ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS norm_intensity DECIMAL DEFAULT 0;
    ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS replacement_cycle_days INTEGER DEFAULT 365;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- 2. Restoring the master catalog with calculation norms
DELETE FROM public.inventory_items;

INSERT INTO public.inventory_items (name, sku, color, price, stock, category, norm_area, norm_personnel, norm_intensity, replacement_cycle_days) VALUES

-- 🔴 RED ZONE: Санузлы
('МОП микрофибра', 'RED-MOP-01', '#ef4444', 450, 150, 'МОПы и Швабры', 3.0, 2.5, 0.12, 90),
('МОП хлопковый', 'RED-MOP-02', '#ef4444', 380, 85, 'МОПы и Швабры', 2.0, 1.5, 0.08, 120),
('Ведро с отжимом', 'RED-BKT-03', '#ef4444', 2800, 8, 'Ведра и Системы', 0.5, 0.2, 0.05, 365),
('Салфетка микрофибра', 'RED-CLT-01', '#ef4444', 120, 500, 'Салфетки и Ветошь', 8.0, 3.0, 1.5, 30),
('Перчатки резиновые', 'RED-PPE-01', '#ef4444', 180, 300, 'СИЗ', 0, 1.0, 0.5, 14),

-- 🟡 YELLOW ZONE: Поверхности в ванных
('МОП микрофибра', 'YEL-MOP-01', '#facc15', 460, 120, 'МОПы и Швабры', 2.5, 1.0, 0.05, 90),
('Салфетка микрофибра', 'YEL-CLT-01', '#facc15', 120, 400, 'Салфетки и Ветошь', 6.0, 2.0, 0.8, 30),
('Ведро малое', 'YEL-BKT-02', '#facc15', 450, 70, 'Ведра и Системы', 0.8, 0.1, 0.02, 365),

-- 🟢 GREEN ZONE: Кухня / Бар
('МОП микрофибра', 'GRN-MOP-01', '#22c55e', 480, 140, 'МОПы и Швабры', 3.0, 2.5, 0.12, 90),
('Швабра профессиональная', 'GRN-MOP-02', '#22c55e', 1500, 25, 'МОПы и Швабры', 0.5, 0.2, 0.05, 180),
('Двухведерная система', 'GRN-BKT-01', '#22c55e', 5200, 10, 'Ведра и Системы', 1.0, 0.5, 0.1, 730),
('Салфетка микрофибра', 'GRN-CLT-01', '#22c55e', 140, 600, 'Салфетки и Ветошь', 10.0, 4.0, 2.0, 30),
('Доска разделочная (Овощи)', 'GRN-BRD-01', '#22c55e', 1800, 40, 'Кухонный инвентарь', 0.5, 0.3, 0.1, 365),

-- 🔵 BLUE ZONE: Общие зоны
('МОП микрофибра', 'BLU-MOP-01', '#3b82f6', 440, 200, 'МОПы и Швабры', 1.5, 0.8, 0.03, 90),
('Салфетка микрофибра', 'BLU-CLT-01', '#3b82f6', 120, 800, 'Салфетки и Ветошь', 5.0, 1.0, 0.2, 30),
('Ведро стандартное', 'BLU-BKT-01', '#3b82f6', 1100, 50, 'Ведра и Системы', 0.5, 0.2, 0.05, 365);