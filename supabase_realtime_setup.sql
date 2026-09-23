-- ==============================================================================
-- SCRIPT DE ATIVAÇÃO DE TEMPO REAL ULTRA RÁPIDO (SUPABASE REALTIME)
-- Execute este script no SQL Editor do seu projeto Supabase para garantir paridade
-- simultânea em milissegundos entre Chrome, Safari, Edge e Celular!
-- ==============================================================================

-- 1. Habilitar Replica Identity FULL
-- Isso obriga o PostgreSQL a emitir o evento completo em qualquer INSERT, UPDATE ou DELETE
-- para que o WebSocket do Supabase transmita para todos os navegadores abertos no mesmo milissegundo.
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.users_crm REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 2. Garantir coluna tasks na tabela leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]'::jsonb;

-- 3. Inscrever todas as tabelas na publicação 'supabase_realtime'
DO $$
BEGIN
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
    AND tablename = 'users_crm'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users_crm;
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

-- 4. Garantir Políticas RLS permissivas para que o WebSocket nunca sofra bloqueio de canal
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir Acesso Completo aos Leads CRM" ON public.leads;
CREATE POLICY "Permitir Acesso Completo aos Leads CRM" 
ON public.leads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.users_crm ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir Acesso Completo aos Usuarios CRM" ON public.users_crm;
CREATE POLICY "Permitir Acesso Completo aos Usuarios CRM" 
ON public.users_crm FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir Acesso Completo as Mensagens CRM" ON public.messages;
CREATE POLICY "Permitir Acesso Completo as Mensagens CRM" 
ON public.messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
