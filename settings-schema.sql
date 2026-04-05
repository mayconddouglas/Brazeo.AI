-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id integer PRIMARY KEY DEFAULT 1,
  agent_name text NOT NULL DEFAULT 'Brazeo.IA',
  agent_tone text NOT NULL DEFAULT 'friendly',
  agent_instructions text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Insert default row (since we only need one row with ID=1)
INSERT INTO settings (id, agent_name, agent_tone, agent_instructions)
VALUES (1, 'Brazeo.IA', 'friendly', 'Você é um assistente virtual prestativo, educado e focado em resolver os problemas do cliente de forma rápida.')
ON CONFLICT (id) DO NOTHING;
