-- Adiciona colunas context e weigh_frequency em weight_records (rode no SQL Editor do Supabase)
-- Necessário para upsert por (user_id, date): se não existir, crie com:
-- CREATE UNIQUE INDEX IF NOT EXISTS weight_records_user_date_key ON weight_records (user_id, date);
ALTER TABLE weight_records ADD COLUMN IF NOT EXISTS context text;
ALTER TABLE weight_records ADD COLUMN IF NOT EXISTS weigh_frequency text;
