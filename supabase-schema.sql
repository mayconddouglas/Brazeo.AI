-- Habilitar a extensão pgcrypto para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Habilitar a extensão pgvector para similaridade vetorial (RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela: users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         TEXT UNIQUE NOT NULL,        -- número WhatsApp (+5511...)
  name          TEXT,
  status        TEXT DEFAULT 'active',       -- active | blocked | waitlist
  preferences   JSONB DEFAULT '{}',          -- tom, idioma, preferências
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ
);

-- Tabela: messages
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,                 -- user | assistant
  content     TEXT NOT NULL,
  intent      TEXT,                          -- criar_lembrete | resumir_texto | ...
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: reminders
CREATE TABLE reminders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,               -- descrição do lembrete
  scheduled_at  TIMESTAMPTZ NOT NULL,        -- quando disparar
  recurrence    TEXT,                        -- daily | weekly | null
  status        TEXT DEFAULT 'pending',      -- pending | sent | cancelled
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: tasks
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  done        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  done_at     TIMESTAMPTZ
);

-- Tabela: broadcasts
CREATE TABLE broadcasts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message       TEXT NOT NULL,
  target        TEXT DEFAULT 'all',          -- all | active | specific
  target_users  UUID[],                      -- se target = specific
  scheduled_at  TIMESTAMPTZ,
  status        TEXT DEFAULT 'draft',        -- draft | scheduled | sent
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: knowledge_base (RAG / Embeddings)
CREATE TABLE knowledge_base (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content       TEXT NOT NULL,               -- o pedaço do texto (chunk)
  embedding     vector(1536),                -- vetor matemático da OpenAI (text-embedding-3-small)
  metadata      JSONB DEFAULT '{}',          -- titulo, link, tag, autor
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Cria um índice HNSW para busca vetorial muito rápida em bases gigantes
CREATE INDEX ON knowledge_base USING hnsw (embedding vector_cosine_ops);

-- Função de Busca por Similaridade (RPC)
CREATE OR REPLACE FUNCTION match_knowledge (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    knowledge_base.id,
    knowledge_base.content,
    knowledge_base.metadata,
    1 - (knowledge_base.embedding <=> query_embedding) AS similarity
  FROM knowledge_base
  WHERE 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Tabela: settings (Configurações Globais do Agente)
CREATE TABLE IF NOT EXISTS settings (
  id integer PRIMARY KEY DEFAULT 1,
  agent_name text NOT NULL DEFAULT 'Brazeo.IA',
  agent_tone text NOT NULL DEFAULT 'friendly',
  agent_instructions text,
  evolution_api_url text,
  evolution_api_key text,
  evolution_instance_name text,
  openrouter_api_key text,
  openai_api_key text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Insert default row
INSERT INTO settings (id, agent_name, agent_tone, agent_instructions)
VALUES (1, 'Brazeo.IA', 'friendly', 'Você é um assistente virtual prestativo, educado e focado em resolver os problemas do cliente de forma rápida.')
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS (Apenas Service Role pode acessar tudo por padrão, anon não tem acesso)
-- Se precisar de acesso autenticado via painel admin, crie políticas para auth.uid()
CREATE POLICY "Allow full access to authenticated users" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON messages FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON reminders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON tasks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON broadcasts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON knowledge_base FOR ALL USING (auth.role() = 'authenticated');
