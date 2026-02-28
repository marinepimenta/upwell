-- Tabela de notificações (histórico no servidor)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON notifications FOR ALL
  USING (auth.uid() = user_id);

-- Colunas de preferências de notificação e push no perfil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_checkin boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_peso boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_glp1 boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_streak boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_marcos boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS checkin_reminder_hour integer DEFAULT 20;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS checkin_reminder_minute integer DEFAULT 0;
