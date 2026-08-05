-- ==========================================
-- SCRIPT DE SCHEMA PARA O SITE LÍDER CRM
-- Copie e cole este script no painel "SQL Editor" do seu Supabase
-- ==========================================

-- ALTER TABLE comandos para atualizar banco de dados existente (caso necessário):
-- ALTER TABLE users_crm ADD COLUMN IF NOT EXISTS creci TEXT;
-- ALTER TABLE users_crm ADD COLUMN IF NOT EXISTS bio TEXT;
-- ALTER TABLE users_crm ADD COLUMN IF NOT EXISTS birthdate DATE;
-- ALTER TABLE users_crm ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
-- ALTER TABLE users_crm ADD COLUMN IF NOT EXISTS last_online_at TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE users_crm ADD COLUMN IF NOT EXISTS total_online_time INTEGER DEFAULT 0;

-- 1. Tabela de Usuários do CRM
CREATE TABLE IF NOT EXISTS users_crm (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'broker')),
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    password TEXT NOT NULL DEFAULT '123',
    is_whatsapp_connected BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL CHECK (status IN ('online', 'offline')) DEFAULT 'online',
    manager_id TEXT REFERENCES users_crm(id) ON DELETE SET NULL,
    creci TEXT,
    bio TEXT,
    birthdate DATE,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    last_online_at TIMESTAMP WITH TIME ZONE,
    total_online_time INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Realtime de Forma Segura para Usuários
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'users_crm'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users_crm;
  END IF;
END $$;

-- 2. Tabela de Leads Capturados
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    property_name TEXT NOT NULL,
    property_bg TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('new', 'contact', 'visit', 'proposal', 'closed', 'lost')) DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    assigned_broker_id TEXT REFERENCES users_crm(id) ON DELETE CASCADE,
    notes TEXT[] DEFAULT '{}'::text[] NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    attended_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar Realtime de Forma Segura para Leads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE leads;
  END IF;
END $$;

-- 3. Inserir Dados Iniciais Padrão (Seed)
-- Evita erros de duplicação caso os registros já existam usando ON CONFLICT
INSERT INTO users_crm (id, name, avatar, role, email, phone, password, is_whatsapp_connected, status, manager_id, creci, bio)
VALUES
  (
    'diretoria-lider', 
    'Joseph Nascimento', 
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 
    'admin', 
    'joseph3dinfo@gmail.com', 
    '+55 81 91337935', 
    '81546223*#', 
    false, 
    'online', 
    NULL,
    'PE 56789-J',
    'Direção geral da Líder Imobiliária. Compromisso permanente com a ética, liderança e excelência em negócios imobiliários.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO users_crm (id, name, avatar, role, email, phone, password, is_whatsapp_connected, status, manager_id, creci, bio)
VALUES
  (
    'daiany-martins', 
    'Daiany Martins', 
    '/corretor-daiany.jpg', 
    'broker', 
    'daiany@liderimobiliaria.com.br', 
    '+55 81 98184-4018', 
    '123456', 
    false, 
    'online', 
    'diretoria-lider',
    'CRECI 21245',
    'Corretora de imóveis com foco em atendimento humanizado e melhores oportunidades.'
  ),
  (
    'matheus-souto', 
    'Matheus Souto', 
    '/corretor-matheus-souto.jpg', 
    'broker', 
    'matheus@liderimobiliaria.com.br', 
    '+55 81 98864-3830', 
    '123456', 
    false, 
    'online', 
    'diretoria-lider',
    'CRECI 21612',
    'Corretor de imóveis especializado em negócios de alto valor e investimentos.'
  ),
  (
    'samira-martins', 
    'Samira Martins', 
    '/corretor-samira-martins.jpg', 
    'broker', 
    'samira@liderimobiliaria.com.br', 
    '+55 81 97322-5711', 
    '123456', 
    false, 
    'online', 
    'diretoria-lider',
    'CRECI 23592',
    'Corretora de imóveis com atendimento exclusivo e consultoria imobiliária.'
  ),
  (
    'izabel-cristina', 
    'Izabel Cristina', 
    '/corretor-izabel-cristina.jpg', 
    'broker', 
    'izabel@liderimobiliaria.com.br', 
    '+55 81 98611-6336', 
    '123456', 
    false, 
    'online', 
    'diretoria-lider',
    'CRECI 22925',
    'Consultora imobiliária especializada no mercado residencial de Pernambuco.'
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Configuração de RLS e Políticas de Acesso Público
-- Desabilita RLS por padrão para conexões diretas simplificadas do frontend
ALTER TABLE users_crm DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- Como precaução extra, caso a RLS seja habilitada pelo Supabase, criamos as políticas de acesso livre para leitura e gravação pública
DROP POLICY IF EXISTS "Permitir tudo para usuarios_crm" ON users_crm;
CREATE POLICY "Permitir tudo para usuarios_crm" ON users_crm FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir tudo para leads" ON leads;
CREATE POLICY "Permitir tudo para leads" ON leads FOR ALL USING (true) WITH CHECK (true);

-- 5. Tabela de Mensagens do Chat do WhatsApp
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('client', 'broker')),
    text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'sent'
);

-- Desabilitar RLS para mensagens
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Política de segurança pública para mensagens (caso RLS seja reativado)
DROP POLICY IF EXISTS "Permitir tudo para mensagens" ON messages;
CREATE POLICY "Permitir tudo para mensagens" ON messages FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Realtime para mensagens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;
