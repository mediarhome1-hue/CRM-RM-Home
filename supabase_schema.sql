-- ==============================================================================
-- SCRIPT OFICIAL DE SCHEMA E MIGRAÇÃO DO BANCO DE DADOS — CRM RM HOME IMOBILIÁRIA
-- Copie e execute este script no painel "SQL Editor" do seu projeto Supabase.
-- Ele é 100% idempotente: pode ser executado em bancos novos ou já em produção.
-- ==============================================================================

-- 1. Tabela de Usuários / Corretores do CRM (users_crm)
CREATE TABLE IF NOT EXISTS public.users_crm (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'broker')) DEFAULT 'broker',
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    password TEXT NOT NULL DEFAULT '123',
    is_whatsapp_connected BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL CHECK (status IN ('online', 'offline')) DEFAULT 'offline',
    manager_id TEXT REFERENCES public.users_crm(id) ON DELETE SET NULL,
    creci TEXT,
    bio TEXT,
    birthdate DATE,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    last_online_at TIMESTAMP WITH TIME ZONE,
    total_online_time INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir todas as colunas caso a tabela users_crm já existisse em versão anterior
ALTER TABLE public.users_crm ADD COLUMN IF NOT EXISTS avatar TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150';
ALTER TABLE public.users_crm ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'broker';
ALTER TABLE public.users_crm ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '123';
ALTER TABLE public.users_crm ADD COLUMN IF NOT EXISTS is_whatsapp_connected BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.users_crm ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'offline';
ALTER TABLE public.users_crm ADD COLUMN IF NOT EXISTS manager_id TEXT REFERENCES public.users_crm(id) ON DELETE SET NULL;
ALTER TABLE public.users_crm ADD COLUMN IF NOT EXISTS creci TEXT;
ALTER TABLE public.users_crm ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users_crm ADD COLUMN IF NOT EXISTS birthdate DATE;
ALTER TABLE public.users_crm ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.users_crm ADD COLUMN IF NOT EXISTS last_online_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users_crm ADD COLUMN IF NOT EXISTS total_online_time INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.users_crm ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Índices de performance para busca e login de corretores
CREATE INDEX IF NOT EXISTS idx_users_crm_email ON public.users_crm (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_crm_role ON public.users_crm (role);
CREATE INDEX IF NOT EXISTS idx_users_crm_status ON public.users_crm (status);
CREATE INDEX IF NOT EXISTS idx_users_crm_manager_id ON public.users_crm (manager_id);

-- 2. Tabela de Leads Capturados (leads)
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    property_name TEXT NOT NULL,
    property_bg TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('new', 'contact', 'visit', 'proposal', 'closed', 'lost')) DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    assigned_broker_id TEXT REFERENCES public.users_crm(id) ON DELETE SET NULL,
    notes TEXT[] DEFAULT '{}'::text[] NOT NULL,
    tasks JSONB DEFAULT '[]'::jsonb,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    attended_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS attended_at TIMESTAMP WITH TIME ZONE;

-- Garantir que a exclusão de um corretor NUNCA apague os leads dele (ON DELETE SET NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leads_assigned_broker_id_fkey'
      AND table_name = 'leads'
  ) THEN
    ALTER TABLE public.leads DROP CONSTRAINT leads_assigned_broker_id_fkey;
  END IF;
  ALTER TABLE public.leads
    ADD CONSTRAINT leads_assigned_broker_id_fkey
    FOREIGN KEY (assigned_broker_id) REFERENCES public.users_crm(id) ON DELETE SET NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_broker_id ON public.leads (assigned_broker_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);

-- 3. Tabela de Mensagens do Chat do WhatsApp (messages)
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('client', 'broker')),
    text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'sent'
);

CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages (lead_id);

-- 4. Habilitar Replica Identity FULL e Publicação Realtime
ALTER TABLE public.users_crm REPLICA IDENTITY FULL;
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'users_crm'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users_crm;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- 5. Configuração de RLS e Políticas de Acesso para o Backend e Frontend
ALTER TABLE public.users_crm ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para usuarios_crm" ON public.users_crm;
DROP POLICY IF EXISTS "Permitir Acesso Completo aos Usuarios CRM" ON public.users_crm;
CREATE POLICY "Permitir Acesso Completo aos Usuarios CRM"
ON public.users_crm FOR ALL TO anon, authenticated, service_role
USING (true) WITH CHECK (true);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para leads" ON public.leads;
DROP POLICY IF EXISTS "Permitir Acesso Completo aos Leads CRM" ON public.leads;
CREATE POLICY "Permitir Acesso Completo aos Leads CRM"
ON public.leads FOR ALL TO anon, authenticated, service_role
USING (true) WITH CHECK (true);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para mensagens" ON public.messages;
DROP POLICY IF EXISTS "Permitir Acesso Completo as Mensagens CRM" ON public.messages;
CREATE POLICY "Permitir Acesso Completo as Mensagens CRM"
ON public.messages FOR ALL TO anon, authenticated, service_role
USING (true) WITH CHECK (true);

-- 6. Limpar usuários antigos e manter APENAS Joseph Nascimento (Direção)
UPDATE public.leads
SET assigned_broker_id = 'diretoria-lider'
WHERE assigned_broker_id IS NOT NULL
  AND assigned_broker_id <> 'diretoria-lider';

DELETE FROM public.users_crm
WHERE id <> 'diretoria-lider'
  AND LOWER(email) <> 'joseph3dinfo@gmail.com';

INSERT INTO public.users_crm (id, name, avatar, role, email, phone, password, is_whatsapp_connected, status, manager_id, creci, bio)
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
    'Direção geral da RM Home Imobiliária. Compromisso permanente com a ética, liderança e excelência em negócios imobiliários.'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  creci = EXCLUDED.creci,
  bio = EXCLUDED.bio;
