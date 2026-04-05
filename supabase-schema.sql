-- Habilitar a extensão pgcrypto para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS (Apenas Service Role pode acessar tudo por padrão, anon não tem acesso)
-- Se precisar de acesso autenticado via painel admin, crie políticas para auth.uid()
CREATE POLICY "Allow full access to authenticated users" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON messages FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON reminders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON tasks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users" ON broadcasts FOR ALL USING (auth.role() = 'authenticated');
