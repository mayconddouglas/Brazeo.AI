-- Adicionar novas colunas para as chaves de API na tabela settings
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS evolution_api_url text,
ADD COLUMN IF NOT EXISTS evolution_api_key text,
ADD COLUMN IF NOT EXISTS evolution_instance_name text,
ADD COLUMN IF NOT EXISTS openrouter_api_key text;