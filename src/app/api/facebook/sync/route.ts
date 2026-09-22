import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder-url.supabase.co', supabaseKey || 'placeholder-key');

// Rota de Sincronização / Re-fetch forçado dos últimos leads criados no Meta
export async function GET(req: Request) {
  try {
    const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;

    if (!pageAccessToken) {
      return NextResponse.json({ 
        error: 'O token do Facebook (FACEBOOK_PAGE_ACCESS_TOKEN) não está configurado nas variáveis de ambiente da Vercel. Por favor, insira o Token da Página no painel da Vercel.' 
      }, { status: 400 });
    }

    // 1. Priorizar o ID da página configurado nas variáveis (FACEBOOK_PAGE_ID) ou fallback para busca via /me/accounts
    let pages: any[] = [];
    const envPageId = process.env.FACEBOOK_PAGE_ID || process.env.FB_PAGE_ID || process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID || '648684245476381';

    if (envPageId) {
      pages.push({ id: envPageId, access_token: pageAccessToken });
    }

    const meRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${pageAccessToken}`);
    if (meRes.ok) {
      const meData = await meRes.json();
      if (meData.data && meData.data.length > 0) {
        for (const p of meData.data) {
          if (!pages.some(existing => existing.id === p.id)) {
            pages.push({ id: p.id, name: p.name, access_token: p.access_token || pageAccessToken });
          }
        }
      }
    }

    let importedLeadsCount = 0;
    const importedDetails: any[] = [];
    const metaErrors: string[] = [];

    // Buscar formulários e leads de cada entidade associada
    for (const page of pages) {
      const pageId = page.id;
      const pageToken = page.access_token || pageAccessToken;

      // Buscar os formulários de cadastro da página/conta de anúncio
      const formsRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/leadgen_forms?access_token=${pageToken}`);
      if (!formsRes.ok) {
        const errJson = await formsRes.json().catch(() => null);
        metaErrors.push(`Página/Entidade ${pageId}: ${errJson?.error?.message || formsRes.statusText}`);
        continue;
      }

      const formsData = await formsRes.json();
      const forms = formsData.data || [];

      for (const form of forms) {
        const formId = form.id;
        const formName = form.name || 'Facebook Lead Ads';

        // Buscar os leads gerados neste formulário
        const leadsRes = await fetch(`https://graph.facebook.com/v20.0/${formId}/leads?access_token=${pageToken}`);
        if (!leadsRes.ok) continue;

        const leadsData = await leadsRes.json();
        const leadsList = leadsData.data || [];

        // Buscar leads já existentes no Supabase para evitar duplicados ou atualizar
        const { data: existingLeads } = await supabase.from('leads').select('*');

        for (const lead of leadsList) {
          const fieldData = lead.field_data || [];
          let name = '';
          let phone = '';
          let email = '';

          for (const field of fieldData) {
            const fieldName = (field.name || '').toLowerCase().trim();
            const fieldValue = field.values?.[0] || '';

            if (!fieldValue) continue;

            if (fieldName.includes('name') || fieldName.includes('nome') || fieldName.includes('full_name')) {
              name = fieldValue;
            } else if (
              fieldName.includes('phone') || 
              fieldName.includes('telef') || 
              fieldName.includes('cel') || 
              fieldName.includes('whats') || 
              fieldName.includes('fone') || 
              fieldName.includes('contato') ||
              fieldName.includes('mobile')
            ) {
              phone = fieldValue;
            } else if (fieldName.includes('email') || fieldName.includes('mail')) {
              email = fieldValue;
            }
          }

          if (!phone) {
            for (const field of fieldData) {
              const val = field.values?.[0] || '';
              const digitsOnly = val.replace(/\D/g, '');
              if (digitsOnly.length >= 10 && digitsOnly.length <= 13) {
                phone = val;
                break;
              }
            }
          }

          if (!name) name = 'Lead Facebook';
          if (!phone) continue;

          const cleanPhone = phone.replace(/\D/g, '');
          const matchedLead = existingLeads?.find(l => {
            const cleanLeadPhone = (l.phone || '').replace(/\D/g, '');
            if (!cleanPhone || !cleanLeadPhone) return false;

            if (cleanPhone === cleanLeadPhone) return true;
            if (cleanPhone.length >= 8 && cleanLeadPhone.length >= 8) {
              return cleanPhone.endsWith(cleanLeadPhone) || cleanLeadPhone.endsWith(cleanPhone);
            }
            return false;
          });

          if (matchedLead) {
            // Atualizar lead existente
            const updatedNotes = [
              ...matchedLead.notes,
              `Sincronização forçada via Meta API (Formulário: ${formName}) em ${new Date().toLocaleString('pt-BR')}.`
            ];

            await supabase
              .from('leads')
              .update({
                notes: updatedNotes,
                status: 'new',
                property_name: formName,
                last_activity_at: new Date().toISOString()
              })
              .eq('id', matchedLead.id);

            importedDetails.push({ name, phone, status: 'atualizado' });
          } else {
            // Atribuir corretor online ou rotativo sequencial via banco
            const { data: users } = await supabase.from('users_crm').select('*');
            const brokers = users?.filter(u => u.role === 'broker') || [];
            const onlineBrokers = brokers.filter(u => u.status === 'online');
            const targetPool = onlineBrokers.length > 0 ? onlineBrokers : (brokers.length > 0 ? brokers : users || []);
            let assignedBrokerId = 'diretoria-lider';

            if (targetPool.length > 0) {
              const { data: lastLeads } = await supabase
                .from('leads')
                .select('assigned_broker_id')
                .order('created_at', { ascending: false })
                .limit(5);

              const lastAssignedId = lastLeads?.find(l => l.assigned_broker_id)?.assigned_broker_id;
              let nextIndex = 0;

              if (lastAssignedId) {
                const lastIndex = targetPool.findIndex(u => u.id === lastAssignedId);
                if (lastIndex !== -1) {
                  nextIndex = (lastIndex + 1) % targetPool.length;
                }
              }
              assignedBrokerId = targetPool[nextIndex].id;
            }

            const newLead = {
              id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              name,
              phone,
              email: email || '',
              property_name: formName,
              property_bg: 'bg-blue-600',
              status: 'new',
              created_at: lead.created_time || new Date().toISOString(),
              last_activity_at: new Date().toISOString(),
              assigned_broker_id: assignedBrokerId,
              notes: [`Lead importado via sincronização forçada da Meta (Formulário: ${formName}).`]
            };

            await supabase.from('leads').insert(newLead);
            importedLeadsCount++;
            importedDetails.push({ name, phone, status: 'criado' });
          }
        }
      }
    }

    if (importedLeadsCount === 0 && metaErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Meta API retornou erro ao consultar a página:\n${metaErrors.join('\n')}\n\nVerifique se o token de acesso (FACEBOOK_PAGE_ACCESS_TOKEN) possui a permissão 'leads_retrieval' ou se o ID da Página (FACEBOOK_PAGE_ID) está correto na Vercel.`
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: importedLeadsCount > 0
        ? `Sincronização concluída com sucesso! ${importedLeadsCount} novo(s) lead(s) importado(s) e atribuído(s).`
        : `Sincronização concluída! Todos os leads dos formulários ativos já estão atualizados no CRM.`,
      details: importedDetails
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
