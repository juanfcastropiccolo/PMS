CREATE TABLE IF NOT EXISTS early_birds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: permitir INSERT anónimo (sin auth), bloquear SELECT/UPDATE/DELETE público
ALTER TABLE early_birds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir insert anónimo" ON early_birds FOR INSERT WITH CHECK (true);
CREATE POLICY "Solo admin puede leer" ON early_birds FOR SELECT USING (false);
