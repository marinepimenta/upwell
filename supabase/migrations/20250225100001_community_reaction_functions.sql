-- Funções para incrementar/decrementar contadores de reações no feed
CREATE OR REPLACE FUNCTION increment_reaction(p_feed_id uuid, p_column_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format(
    'UPDATE community_feed SET %I = COALESCE(%I, 0) + 1 WHERE id = $1',
    p_column_name, p_column_name
  ) USING p_feed_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_reaction(p_feed_id uuid, p_column_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format(
    'UPDATE community_feed SET %I = GREATEST(COALESCE(%I, 0) - 1, 0) WHERE id = $1',
    p_column_name, p_column_name
  ) USING p_feed_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
