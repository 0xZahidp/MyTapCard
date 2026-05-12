ALTER TABLE public.financial_methods
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS account_holder text,
  ADD COLUMN IF NOT EXISTS branch_name text,
  ADD COLUMN IF NOT EXISTS routing_number text,
  ADD COLUMN IF NOT EXISTS swift_code text,
  ADD COLUMN IF NOT EXISTS copyable boolean NOT NULL DEFAULT true;