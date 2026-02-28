-- Tabelas do feed da Comunidade UpWell
CREATE TABLE IF NOT EXISTS community_feed (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  emoji text NOT NULL,
  reactions_heart integer DEFAULT 0,
  reactions_fire integer DEFAULT 0,
  reactions_muscle integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE community_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feed"
  ON community_feed FOR SELECT
  USING (true);

CREATE POLICY "Users manage own posts"
  ON community_feed FOR ALL
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS community_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  feed_id uuid REFERENCES community_feed(id) ON DELETE CASCADE,
  reaction text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feed_id, reaction)
);

ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reactions"
  ON community_reactions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view reactions"
  ON community_reactions FOR SELECT
  USING (true);
