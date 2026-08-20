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
      return NextResponse.json({ error: 'Token de acesso do Facebook não configurado.' }, { status: 500 });
    }

    // 1. Tentar buscar as contas do usuário (/me/accounts) ou dados diretos do nó (/me)
    let pages: any[] = [];
    const meRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${pageAccessToken}`);
    
    if (meRes.ok) {
      const meData = await meRes.json();
      pages = meData.data || [];
    } else {
      // Se /me/accounts falhar (ex: token de página direto ou permissão granular restrita), testamos consultar a própria entidade /me
      const directMeRes = await fetch(`https://graph.facebook.com/v20.0/me?fields=id,name,access_token&access_token=${pageAccessToken}`);
      if (directMeRes.ok) {
        const directMeData = await directMeRes.json();
        if (directMeData.id) {
          pages = [{ id: directMeData.id, name: directMeData.name, access_token: pageAccessToken }];
        }
      }
    }

    if (pages.length === 0) {
      // Tentar consultar os formulários (leadgen_forms) direto de um PAGE_ID ou AD_ACCOUNT se houver configurado nas variáveis de ambiente
      const envPageId = process.env.FACEBOOK_PAGE_ID || process.env.FB_PAGE_ID;
      if (envPageId) {
        pages = [{ id: envPageId, access_token: pageAccessToken }];
      } else {
        return NextResponse.json({ 
          error: 'O token configurado (FACEBOOK_PAGE_ACCESS_TOKEN) expirou ou não tem permissão para listar /me/accounts. Atualize o Token de Acesso da Página no painel da Meta/Vercel.' 
        }, { status: 400 });
      }
    }

    let importedLeadsCount = 0;
    const importedDetails: any[] = [];

    // Buscar formulários e leads de cada página associada
    for (const page of pages) {
      const pageId = page.id;
      const pageToken = page.access_token || pageAccessToken;

      // Buscar os formulários de cadastro da página
      const formsRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/leadgen_forms?access_token=${pageToken}`);
      if (!formsRes.ok) continue;

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
            const cleanLeadPhone = l.phone.replace(/\D/g, '');
            return (
              cleanPhone.endsWith(cleanLeadPhone) || 
              cleanLeadPhone.endsWith(cleanPhone) ||
              cleanPhone === cleanLeadPhone
            );
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
            // Atribuir corretor online ou rotativo
            const { data: users } = await supabase.from('users_crm').select('*');
            const onlineBrokers = users?.filter(u => u.role === 'broker' && u.status === 'online') || [];
            let assignedBrokerId = 'diretoria-lider';

            if (onlineBrokers.length > 0) {
              assignedBrokerId = onlineBrokers[Math.floor(Math.random() * onlineBrokers.length)].id;
            } else {
              const allBrokers = users?.filter(u => u.role === 'broker') || [];
              if (allBrokers.length > 0) {
                assignedBrokerId = allBrokers[Math.floor(Math.random() * allBrokers.length)].id;
              } else if (users && users.length > 0) {
                assignedBrokerId = users[0].id;
              }
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

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída! ${importedLeadsCount} novo(s) lead(s) importado(s).`,
      details: importedDetails
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
