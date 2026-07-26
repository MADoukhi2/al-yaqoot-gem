-- Enums
CREATE TYPE public.metal_type AS ENUM ('Gold', 'Silver');
CREATE TYPE public.item_kind AS ENUM ('Sellable', 'Service');
CREATE TYPE public.service_status AS ENUM ('Received', 'Delivering to Workshop', 'Crafting', 'Polishing', 'Heading to Shop', 'Ready');
CREATE TYPE public.order_channel AS ENUM ('Retail', 'Investment');
CREATE TYPE public.order_status AS ENUM ('Pending', 'Confirmed', 'Fulfilled', 'Cancelled');

-- Shared updated_at trigger fn
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  preferred_lang TEXT NOT NULL DEFAULT 'ar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_staff_all" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER customers_set_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Raw assets
CREATE TABLE public.raw_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  metal public.metal_type NOT NULL DEFAULT 'Gold',
  weight_g NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (weight_g >= 0),
  karat SMALLINT NOT NULL DEFAULT 24 CHECK (karat BETWEEN 1 AND 24),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.raw_assets TO authenticated;
GRANT ALL ON public.raw_assets TO service_role;
ALTER TABLE public.raw_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "raw_assets_staff_all" ON public.raw_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER raw_assets_set_updated_at BEFORE UPDATE ON public.raw_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Finished items (sellable stock + service jobs)
CREATE TABLE public.finished_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Ring',
  weight_g NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (weight_g >= 0),
  karat SMALLINT NOT NULL DEFAULT 22 CHECK (karat BETWEEN 1 AND 24),
  labor_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (labor_cost >= 0),
  profit NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (profit >= 0),
  kind public.item_kind NOT NULL DEFAULT 'Sellable',
  status public.service_status,
  artisan TEXT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  sold BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finished_items TO authenticated;
GRANT ALL ON public.finished_items TO service_role;
ALTER TABLE public.finished_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finished_items_staff_all" ON public.finished_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER finished_items_set_updated_at BEFORE UPDATE ON public.finished_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Orders
CREATE SEQUENCE public.order_number_seq START 24100;
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT NOT NULL UNIQUE DEFAULT ('ORD-' || nextval('public.order_number_seq')),
  channel public.order_channel NOT NULL DEFAULT 'Retail',
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL DEFAULT 'Walk-in',
  status public.order_status NOT NULL DEFAULT 'Pending',
  gold_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_weight_g NUMERIC(12,3) NOT NULL DEFAULT 0,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  vat NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.order_number_seq TO authenticated;
GRANT ALL ON SEQUENCE public.order_number_seq TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_staff_all" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  finished_item_id UUID REFERENCES public.finished_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  weight_g NUMERIC(12,3) NOT NULL DEFAULT 0,
  karat SMALLINT NOT NULL DEFAULT 24,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_staff_all" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed data
INSERT INTO public.customers (id, name, phone, email) VALUES
  ('11111111-1111-4111-8111-111111111101', 'A. Al-Farsi', '+966500000101', 'alfarsi@example.com'),
  ('11111111-1111-4111-8111-111111111102', 'S. Hassan', '+966500000102', 'shassan@example.com'),
  ('11111111-1111-4111-8111-111111111103', 'M. Rahimi', '+966500000103', NULL),
  ('11111111-1111-4111-8111-111111111104', 'L. Kader', '+966500000104', NULL),
  ('11111111-1111-4111-8111-111111111105', 'R. Idris', '+966500000105', NULL),
  ('11111111-1111-4111-8111-111111111106', 'F. Noor', '+966500000106', NULL),
  ('11111111-1111-4111-8111-111111111107', 'Al Noor Holdings', '+966500000107', 'ops@alnoor.example'),
  ('11111111-1111-4111-8111-111111111108', 'Zafar Bullion Co.', '+966500000108', 'desk@zafar.example');

INSERT INTO public.raw_assets (sku, name, metal, weight_g, karat) VALUES
  ('RAW-AU-001', '24K Gold Bar', 'Gold', 500, 24),
  ('RAW-AU-002', '22K Gold Grain', 'Gold', 320, 22),
  ('RAW-AU-003', '18K Gold Scrap', 'Gold', 210, 18),
  ('RAW-AG-001', 'Silver Ingot', 'Silver', 1200, 24),
  ('RAW-AU-004', '21K Gold Coin Stock', 'Gold', 145, 21);

INSERT INTO public.finished_items (sku, name, category, weight_g, karat, labor_cost, profit, kind, status, artisan, customer_id) VALUES
  ('FIN-RNG-101', 'Classic Band Ring', 'Ring', 6.4, 22, 45, 30, 'Sellable', NULL, NULL, NULL),
  ('FIN-NCK-204', 'Rope Chain 45cm', 'Necklace', 14.2, 21, 90, 60, 'Sellable', NULL, NULL, NULL),
  ('FIN-BRC-330', 'Bangle Set (Pair)', 'Bracelet', 22.0, 22, 140, 100, 'Sellable', NULL, NULL, NULL),
  ('FIN-ERG-412', 'Drop Earrings', 'Earring', 4.8, 18, 60, 40, 'Sellable', NULL, NULL, NULL),
  ('SRV-CST-501', 'Custom Engagement Ring', 'Ring', 8.1, 18, 220, 150, 'Service', 'Crafting', 'Karim', '11111111-1111-4111-8111-111111111101'),
  ('SRV-RPR-502', 'Necklace Clasp Repair', 'Repair', 12.6, 21, 40, 20, 'Service', 'Polishing', 'Nadia', '11111111-1111-4111-8111-111111111102'),
  ('SRV-CST-503', 'Bespoke Bangle', 'Bracelet', 18.4, 22, 180, 120, 'Service', 'Delivering to Workshop', 'Karim', '11111111-1111-4111-8111-111111111103'),
  ('SRV-RPR-504', 'Chain Re-link', 'Repair', 9.2, 21, 35, 15, 'Service', 'Ready', 'Youssef', '11111111-1111-4111-8111-111111111104'),
  ('SRV-CST-505', 'Signet Ring Resize', 'Ring', 5.5, 18, 30, 20, 'Service', 'Received', NULL, '11111111-1111-4111-8111-111111111105'),
  ('SRV-CST-506', 'Wedding Set Polish', 'Set', 16.0, 22, 55, 35, 'Service', 'Heading to Shop', 'Nadia', '11111111-1111-4111-8111-111111111106');

INSERT INTO public.orders (id, order_no, channel, customer_id, customer_name, status, gold_price, total_weight_g, subtotal, vat, total) VALUES
  ('22222222-2222-4222-8222-222222222201', 'ORD-24011', 'Retail', NULL, 'Walk-in #24011', 'Pending', 485.15, 12.4, 1234.78, 185.22, 1420.00),
  ('22222222-2222-4222-8222-222222222202', 'ORD-24012', 'Retail', '11111111-1111-4111-8111-111111111102', 'S. Hassan', 'Pending', 485.15, 6.4, 600.00, 90.00, 690.00),
  ('22222222-2222-4222-8222-222222222203', 'INV-8801', 'Investment', '11111111-1111-4111-8111-111111111107', 'Al Noor Holdings', 'Pending', 485.15, 500, 37217.39, 5582.61, 42800.00),
  ('22222222-2222-4222-8222-222222222204', 'INV-8802', 'Investment', '11111111-1111-4111-8111-111111111108', 'Zafar Bullion Co.', 'Confirmed', 485.15, 250, 18695.65, 2804.35, 21500.00),
  ('22222222-2222-4222-8222-222222222205', 'ORD-24010', 'Retail', '11111111-1111-4111-8111-111111111104', 'L. Kader', 'Confirmed', 485.15, 22.0, 2069.57, 310.43, 2380.00);

INSERT INTO public.order_items (order_id, description, weight_g, karat, quantity, unit_price, line_total) VALUES
  ('22222222-2222-4222-8222-222222222201', 'Classic Band Ring', 6.4, 22, 1, 710.00, 710.00),
  ('22222222-2222-4222-8222-222222222201', 'Drop Earrings', 6.0, 18, 1, 710.00, 710.00),
  ('22222222-2222-4222-8222-222222222202', 'Classic Band Ring', 6.4, 22, 1, 690.00, 690.00),
  ('22222222-2222-4222-8222-222222222203', '24K Investment Bar 500g', 500, 24, 1, 42800.00, 42800.00),
  ('22222222-2222-4222-8222-222222222204', '24K Investment Bar 250g', 250, 24, 1, 21500.00, 21500.00),
  ('22222222-2222-4222-8222-222222222205', 'Bangle Set (Pair)', 22.0, 22, 1, 2380.00, 2380.00);