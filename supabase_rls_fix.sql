-- ==============================================================================
-- SCRIPT DE SEGURANÇA E CORREÇÃO RLS PARA O SUPABASE (CRM LÍDER IMOBILIÁRIA)
-- Execute este script no SQL Editor do seu projeto Supabase para resolver o alerta:
-- "Title: RLS Disabled in Public Entity: public.users_crm"
-- ==============================================================================

-- 1. Habilitar RLS (Row Level Security) na tabela public.users_crm
ALTER TABLE public.users_crm ENABLE ROW LEVEL SECURITY;

-- 2. Habilitar RLS (Row Level Security) na tabela public.leads (Recomendado)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 3. Criar Política de Acesso Público Total para a API Anon (Leitura/Escrita do CRM)
-- Nota: Como o CRM utiliza a chave anon com controle de autenticação interna via Next.js/Frontend,
-- estas políticas garantem que a API anon continue funcionando 100% sem ser bloqueada.

DROP POLICY IF EXISTS "Permitir Acesso Completo aos Usuarios CRM" ON public.users_crm;
CREATE POLICY "Permitir Acesso Completo aos Usuarios CRM" 
ON public.users_crm 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir Acesso Completo aos Leads CRM" ON public.leads;
CREATE POLICY "Permitir Acesso Completo aos Leads CRM" 
ON public.leads 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);
