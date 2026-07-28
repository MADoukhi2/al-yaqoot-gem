
-- VAT category enum
CREATE TYPE public.vat_category AS ENUM ('Standard', 'Zero', 'Exempt');
CREATE TYPE public.invoice_type AS ENUM ('Simplified', 'Standard');
CREATE TYPE public.invoice_status AS ENUM ('Draft', 'Issued', 'Cancelled');

-- Company profile (single row)
CREATE TABLE public.company_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL DEFAULT '',
  name_ar text NOT NULL DEFAULT '',
  cr_number text NOT NULL DEFAULT '',
  vat_number text NOT NULL DEFAULT '',
  address_en text NOT NULL DEFAULT '',
  address_ar text NOT NULL DEFAULT '',
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_profile TO authenticated;
GRANT ALL ON public.company_profile TO service_role;
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_profile_staff_all ON public.company_profile FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER company_profile_updated_at BEFORE UPDATE ON public.company_profile FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Clients: extend customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS vat_number text;

-- Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ar text NOT NULL DEFAULT '',
  unit_price numeric NOT NULL DEFAULT 0,
  vat_category public.vat_category NOT NULL DEFAULT 'Standard',
  unit text NOT NULL DEFAULT 'PCE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_staff_all ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Invoices
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1;
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no text NOT NULL UNIQUE DEFAULT ('INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 5, '0')),
  invoice_type public.invoice_type NOT NULL DEFAULT 'Simplified',
  status public.invoice_status NOT NULL DEFAULT 'Draft',
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  buyer_name text NOT NULL DEFAULT '',
  buyer_vat_number text,
  buyer_address text,
  issue_date timestamptz NOT NULL DEFAULT now(),
  subtotal numeric NOT NULL DEFAULT 0,
  discount_total numeric NOT NULL DEFAULT 0,
  vat_total numeric NOT NULL DEFAULT 0,
  grand_total numeric NOT NULL DEFAULT 0,
  qr_payload text,
  invoice_hash text,
  previous_hash text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_staff_all ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  vat_category public.vat_category NOT NULL DEFAULT 'Standard',
  vat_rate numeric NOT NULL DEFAULT 15,
  net_total numeric NOT NULL DEFAULT 0,
  vat_amount numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoice_items_staff_all ON public.invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX invoice_items_invoice_id_idx ON public.invoice_items(invoice_id);

-- Immutability of issued invoices
CREATE OR REPLACE FUNCTION public.enforce_invoice_immutability()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'Issued' THEN
      RAISE EXCEPTION 'Issued invoices are immutable and cannot be deleted';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status = 'Issued' THEN
    IF NEW.status = 'Cancelled'
       AND NEW.invoice_no = OLD.invoice_no
       AND NEW.grand_total = OLD.grand_total
       AND NEW.vat_total = OLD.vat_total
       AND NEW.subtotal = OLD.subtotal
       AND NEW.invoice_hash IS NOT DISTINCT FROM OLD.invoice_hash THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Issued invoices are immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER invoices_immutable
BEFORE UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.enforce_invoice_immutability();

CREATE OR REPLACE FUNCTION public.enforce_invoice_item_immutability()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  inv_status public.invoice_status;
BEGIN
  SELECT status INTO inv_status FROM public.invoices
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  IF inv_status = 'Issued' THEN
    RAISE EXCEPTION 'Lines of an issued invoice are immutable';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER invoice_items_immutable
BEFORE UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_invoice_item_immutability();
