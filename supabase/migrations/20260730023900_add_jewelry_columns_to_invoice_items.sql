-- Migration: add jewelry metadata columns to invoice_items
-- These columns are optional (nullable) so existing invoices are unaffected.

alter table public.invoice_items
  add column if not exists metal         text    check (metal in ('Gold','Silver','Platinum','Other')),
  add column if not exists karat         integer check (karat in (24, 22, 21, 18, 14, 9)),
  add column if not exists weight_g      numeric(10, 3),
  add column if not exists making_charge numeric(12, 2);

comment on column public.invoice_items.metal         is 'Jewelry metal type: Gold | Silver | Platinum | Other';
comment on column public.invoice_items.karat         is 'Gold karat purity: 24 | 22 | 21 | 18 | 14 | 9';
comment on column public.invoice_items.weight_g      is 'Gross weight in grams';
comment on column public.invoice_items.making_charge is 'Making / labour charge in SAR, already included in unit_price';
