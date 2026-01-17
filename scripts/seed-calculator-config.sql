-- Seed file to populate the Admin Calculator Configuration with Rich Defaults
-- This ensures 'Zones', 'Objects', and 'Intensity Levels' are not empty.

INSERT INTO public.system_settings (key, value)
VALUES (
  'calculator_main',
  jsonb_build_object(
    'formula', jsonb_build_object(
      'isAdvanced', false,
      'customFormula', 'max(q_area, q_staff, q_visitors) * k_zone * k_intensity * (1 + k_reserve)',
      'baseMethod', 'max',
      'factors', jsonb_build_object('area', true, 'staff', true, 'visitors', true),
      'multipliers', jsonb_build_object('zone', true, 'intensity', true, 'reserve', true)
    ),
    'objectTypes', jsonb_build_array(
      jsonb_build_object('value', 'hotel', 'label', '🏨 Отель', 'tiers', jsonb_build_array(1, 2)),
      jsonb_build_object('value', 'restaurant', 'label', '🍽️ Кафе/Ресторан', 'tiers', jsonb_build_array(1, 2)),
      jsonb_build_object('value', 'production_food', 'label', '🏭 Производство (пищевое)', 'tiers', jsonb_build_array(1, 2)),
      jsonb_build_object('value', 'production_nonfood', 'label', '⚙️ Производство (непищевое)', 'tiers', jsonb_build_array(1, 2)),
      jsonb_build_object('value', 'beauty', 'label', '💅 Салон красоты', 'tiers', jsonb_build_array(1, 2)),
      jsonb_build_object('value', 'mall', 'label', '🏬 ТЦ/Общественное пространство', 'tiers', jsonb_build_array(1, 2)),
      jsonb_build_object('value', 'other', 'label', '📍 Другое', 'tiers', jsonb_build_array(1, 2))
    ),
    'zoneTypes', jsonb_build_array(
       jsonb_build_object('value', 'red_zone', 'label', '🔴 RED — Санузлы (Риск)', 'color', '#ef4444', 'coeff', 1.25),
       jsonb_build_object('value', 'yellow_zone', 'label', '🟡 YELLOW — Ванные (Поверхности)', 'color', '#facc15', 'coeff', 1.15),
       jsonb_build_object('value', 'green_zone', 'label', '🟢 GREEN — Кухня / Бар', 'color', '#22c55e', 'coeff', 1.0),
       jsonb_build_object('value', 'blue_zone', 'label', '🔵 BLUE — Общие зоны / Офис', 'color', '#3b82f6', 'coeff', 0.85),
       jsonb_build_object('value', 'pink_zone', 'label', '💗 PINK — Спец. санузлы', 'color', '#ec4899', 'coeff', 1.3),
       jsonb_build_object('value', 'orange_zone', 'label', '🟠 ORANGE — Аллергены', 'color', '#f97316', 'coeff', 1.4),
       jsonb_build_object('value', 'brown_zone', 'label', '🟤 BROWN — Готовое мясо', 'color', '#78350f', 'coeff', 1.05),
       jsonb_build_object('value', 'white_zone', 'label', '⚪ WHITE — Молочные продукты', 'color', '#f8fafc', 'coeff', 0.95)
    ),
    'intensityLevels', jsonb_build_array(
       jsonb_build_object('value', 'low', 'label', 'Низкая', 'coeff', 0.8, 'durabilityThreshold', 0),
       jsonb_build_object('value', 'medium', 'label', 'Средняя', 'coeff', 1.0, 'durabilityThreshold', 0),
       jsonb_build_object('value', 'high', 'label', 'Высокая', 'coeff', 1.2, 'durabilityThreshold', 0),
       jsonb_build_object('value', 'very_high', 'label', 'Очень высокая', 'coeff', 1.3, 'durabilityThreshold', 0),
       jsonb_build_object('value', 'critical', 'label', 'Критическая', 'coeff', 1.5, 'durabilityThreshold', 0)
    ),
    'reserveCoeffs', jsonb_build_object('low', 0.1, 'medium', 0.2, 'high', 0.3, 'default', 0.2),
    'durabilityThresholds', jsonb_build_object('high', 50, 'very_high', 100, 'critical', 200)
  )
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;
