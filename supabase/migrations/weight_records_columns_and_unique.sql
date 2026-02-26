-- Colunas e constraint única para weight_records (rode no SQL Editor do Supabase)
ALTER TABLE weight_records ADD COLUMN IF NOT EXISTS context text;
ALTER TABLE weight_records ADD COLUMN IF NOT EXISTS weigh_frequency text;

-- Garante constraint única por user + data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'weight_records_user_date_unique'
  ) THEN
    ALTER TABLE weight_records
    ADD CONSTRAINT weight_records_user_date_unique
    UNIQUE (user_id, date);
  END IF;
END $$;
