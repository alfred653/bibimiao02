-- 快递运费表
CREATE TABLE IF NOT EXISTS shipping_carriers (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  first_weight     NUMERIC(6,2) NOT NULL DEFAULT 1.0,
  first_cost       NUMERIC(8,2) NOT NULL DEFAULT 23,
  additional_weight NUMERIC(6,2) NOT NULL DEFAULT 0.5,
  additional_cost  NUMERIC(8,2) NOT NULL DEFAULT 5,
  volume_divisor   INTEGER NOT NULL DEFAULT 6000,
  is_active        TEXT DEFAULT 'active',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 种子数据：7 家主流快递
INSERT INTO shipping_carriers (name, first_weight, first_cost, additional_weight, additional_cost, volume_divisor) VALUES
  ('顺丰',  1.0, 23, 0.5, 5,  6000),
  ('圆通',  1.0, 12, 1.0, 8,  6000),
  ('中通',  1.0, 10, 1.0, 6,  6000),
  ('韵达',  1.0, 10, 1.0, 5,  6000),
  ('百世快递', 1.0, 8, 1.0, 4, 6000),
  ('极兔',  1.0, 8,  1.0, 5,  6000),
  ('申通',  1.0, 10, 1.0, 6,  6000);
