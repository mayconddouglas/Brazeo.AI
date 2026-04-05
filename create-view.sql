-- Tabela: view_users_with_last_message
CREATE OR REPLACE VIEW view_users_with_last_message AS
SELECT 
  u.id, 
  u.name, 
  u.phone, 
  u.status,
  m.id as last_message_id,
  m.content as last_message_content,
  m.intent as last_message_intent,
  m.created_at as last_message_created_at
FROM users u
JOIN LATERAL (
  SELECT id, content, intent, created_at
  FROM messages
  WHERE user_id = u.id
  ORDER BY created_at DESC
  LIMIT 1
) m ON true;