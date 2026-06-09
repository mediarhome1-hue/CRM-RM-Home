-- ==========================================
-- SCRIPT DE SCHEMA PARA O SITE LÍDER CRM
-- Copie e cole este script no painel "SQL Editor" do seu Supabase
-- ==========================================

-- ALTER TABLE comandos para atualizar banco de dados existente (caso necessário):
-- ALTER TABLE users_crm ADD COLUMN IF NOT EXISTS creci TEXT;
-- ALTER TABLE users_crm ADD COLUMN IF NOT EXISTS bio TEXT;
-- ALTER TABLE users_crm ADD COLUMN IF NOT EXISTS birthdate DATE;
-- ALTER TABLE users_crm ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;

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
    'Direção Líder', 
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', 
    'admin', 
    'direcao@liderimobiliaria.com.br', 
    '+55 81 99999-0000', 
    'admin', 
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
    'gerente-ricardo', 
    'Ricardo Souza', 
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 
    'manager', 
    'ricardo@liderimobiliaria.com.br', 
    '+55 81 99999-5555', 
    '123', 
    false, 
    'online', 
    NULL,
    'PE 45678-F',
    'Gerente comercial com mais de 10 anos de mercado. Líder nato focado no desenvolvimento de corretores de alta performance.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO users_crm (id, name, avatar, role, email, phone, password, is_whatsapp_connected, status, manager_id, creci, bio)
VALUES
  (
    'ana-silva', 
    'Ana Silva', 
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 
    'broker', 
    'ana@liderimobiliaria.com.br', 
    '+55 81 99999-1111', 
    '123', 
    false, 
    'online', 
    'gerente-ricardo',
    'PE 12345-F',
    'Especialista em lançamentos modernos e imóveis de alto padrão na Zona Sul de Recife. Paixão por realizar sonhos.'
  ),
  (
    'bruno-santos', 
    'Bruno Santos', 
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 
    'broker', 
    'bruno@liderimobiliaria.com.br', 
    '+55 81 99999-2222', 
    '123', 
    false, 
    'online', 
    'gerente-ricardo',
    'PE 23456-F',
    'Foco exclusivo em condomínios fechados, chácaras de luxo e terrenos de médio e alto padrão. Atendimento personalizado.'
  ),
  (
    'carlos-lima', 
    'Carlos Lima', 
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 
    'broker', 
    'carlos@liderimobiliaria.com.br', 
    '+55 81 99999-3333', 
    '123', 
    false, 
    'offline', 
    'gerente-ricardo',
    'PE 34567-F',
    'Consultor de negócios imobiliários comerciais e residenciais na região central. Sólida experiência em negociação corporativa.'
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
