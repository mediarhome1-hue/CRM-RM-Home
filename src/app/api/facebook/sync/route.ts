import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder-url.supabase.co', supabaseKey || 'placeholder-key');
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Rota de Sincronização / Re-fetch forçado dos últimos leads criados no Meta
export async function GET() {
  try {
    const rawToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;

    if (!rawToken) {
      return NextResponse.json({ 
        error: 'O token do Facebook (FACEBOOK_PAGE_ACCESS_TOKEN) não está configurado nas variáveis de ambiente da Vercel. Por favor, insira o Token no painel da Vercel.' 
      }, { status: 400 });
    }

    const envPageId = process.env.FACEBOOK_PAGE_ID || process.env.FB_PAGE_ID || process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID || '648684245476381';

    // 1. Resolução e Descoberta Inteligente de Páginas e Page Access Tokens
    // O Meta exige Page Access Token para os endpoints /{pageId}/leadgen_forms e /{formId}/leads.
    // Se o usuário passou um User Token ou System User Token, obtemos automaticamente o token da página via /me/accounts ou /{pageId}.
    const pages: Array<{ id: string; name?: string; access_token: string }> = [];

    // Tentar obter a lista de páginas e seus respectivos Page Access Tokens via /me/accounts
    try {
      const meRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${rawToken}`);
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.data && Array.isArray(meData.data)) {
          for (const p of meData.data) {
            if (p.id && p.access_token) {
              pages.push({ id: p.id, name: p.name, access_token: p.access_token });
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Meta Sync] Aviso ao consultar /me/accounts:', err);
    }

    // Se o ID da página principal não foi incluído ou não tem token específico, buscar diretamente na Graph API
    if (envPageId && !pages.some(p => p.id === envPageId)) {
      let resolvedToken = rawToken;
      try {
        const pageRes = await fetch(`https://graph.facebook.com/v20.0/${envPageId}?fields=access_token,name&access_token=${rawToken}`);
        if (pageRes.ok) {
          const pageData = await pageRes.json();
          if (pageData.access_token) {
            resolvedToken = pageData.access_token;
            pages.push({ id: envPageId, name: pageData.name || 'Líder Imobiliária', access_token: resolvedToken });
          }
        }
      } catch (err) {
        console.warn(`[Meta Sync] Aviso ao consultar /{pageId}?fields=access_token:`, err);
      }

      // Fallback: se a API não retornou token filho, tentar usar o próprio token fornecido
      if (!pages.some(p => p.id === envPageId)) {
        pages.push({ id: envPageId, name: 'Líder Imobiliária', access_token: resolvedToken });
      }
    }

    // Se nenhuma página foi detectada, criar fallback direto
    if (pages.length === 0) {
      pages.push({ id: envPageId, name: 'Líder Imobiliária', access_token: rawToken });
    }

    // 2. Carregar dados de usuários e estado do Round-Robin UMA ÚNICA VEZ fora dos loops
    const { data: users } = await supabase.from('users_crm').select('*');
    const brokers = users?.filter(u => u.role === 'broker') || [];
    const nowMs = Date.now();
    const onlineBrokers = brokers.filter(u => {
      if (u.status !== 'online') return false;
      if (!u.last_online_at) return false;
      const lastActive = new Date(u.last_online_at).getTime();
      return (nowMs - lastActive) <= 60000;
    });

    // Gerentes e Diretores (Leadership)
    const leadership = users?.filter(u => u.role === 'admin' || u.role === 'manager') || [];
    const onlineLeadership = leadership.filter(u => {
      if (u.status !== 'online') return false;
      if (!u.last_online_at) return false;
      const lastActive = new Date(u.last_online_at).getTime();
      return (nowMs - lastActive) <= 60000;
    });

    // Regra: Se houver corretores online -> corretores online.
    // Se NÃO houver nenhum corretor online -> gerentes e diretores.
    let targetPool: any[] = [];
    if (onlineBrokers.length > 0) {
      targetPool = onlineBrokers;
    } else if (onlineLeadership.length > 0) {
      targetPool = onlineLeadership;
    } else if (leadership.length > 0) {
      targetPool = leadership;
    } else {
      targetPool = brokers.length > 0 ? brokers : users || [];
    }

    const { data: lastLeads } = await supabase
      .from('leads')
      .select('assigned_broker_id')
      .order('created_at', { ascending: false })
      .limit(10);

    const lastAssignedId = lastLeads?.find(l => l.assigned_broker_id)?.assigned_broker_id;
    let nextIndex = 0;
    if (lastAssignedId && targetPool.length > 0) {
      const lastIndex = targetPool.findIndex(u => u.id === lastAssignedId);
      if (lastIndex !== -1) {
        nextIndex = (lastIndex + 1) % targetPool.length;
      }
    }

    // 3. Carregar os últimos leads do banco para checagem rápida em memória (apenas campos necessários)
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id, name, phone, notes, status, property_name')
      .order('created_at', { ascending: false })
      .limit(500);

    let totalFormsFound = 0;
    let totalMetaLeadsFound = 0;
    let createdLeadsCount = 0;
    let updatedLeadsCount = 0;
    const importedDetails: any[] = [];
    const metaErrors: string[] = [];

    // 4. Buscar formulários e leads de cada entidade associada
    for (const page of pages) {
      const pageId = page.id;
      const pageToken = page.access_token || rawToken;

      // Buscar os formulários de cadastro da página
      const formsRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/leadgen_forms?access_token=${pageToken}`);
      if (!formsRes.ok) {
        const errJson = await formsRes.json().catch(() => null);
        const errMsg = errJson?.error?.message || formsRes.statusText;
        metaErrors.push(`Página/Entidade ${pageId}: ${errMsg}`);
        continue;
      }

      const formsData = await formsRes.json();
      const forms = formsData.data || [];

      for (const form of forms) {
        totalFormsFound++;
        const formId = form.id;
        const formName = form.name || 'Facebook Lead Ads';

        // Buscar os leads gerados neste formulário (limitado aos últimos 50 para evitar timeouts)
        const leadsRes = await fetch(`https://graph.facebook.com/v20.0/${formId}/leads?limit=50&access_token=${pageToken}`);
        if (!leadsRes.ok) {
          const errJson = await leadsRes.json().catch(() => null);
          const errMsg = errJson?.error?.message || leadsRes.statusText;
          metaErrors.push(`Formulário "${formName}" (${formId}): ${errMsg}`);
          continue;
        }

        const leadsData = await leadsRes.json();
        const leadsList = leadsData.data || [];
        totalMetaLeadsFound += leadsList.length;

        for (const lead of leadsList) {
          const leadgenId = lead.id;
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
          if (!phone || phone.includes('dummy') || name.includes('dummy')) continue;

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
            // Atualizar lead existente mantendo o histórico de notas limpo e sem duplicações infinitas
            const priorNotes = (matchedLead.notes || []).filter(
              (n: string) => typeof n === 'string' && !n.includes('Sincronização via Meta') && !n.includes('Sincronização forçada')
            );
            const updatedNotes = [
              ...priorNotes,
              `Sincronização via Meta Ads (Formulário: ${formName}, Lead ID: ${leadgenId}) em ${new Date().toLocaleString('pt-BR')}.`
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

            updatedLeadsCount++;
            importedDetails.push({ name, phone, status: 'atualizado' });
          } else {
            // Atribuir próximo corretor via Round-Robin garantido
            let assignedBrokerId = 'diretoria-lider';
            if (targetPool.length > 0) {
              assignedBrokerId = targetPool[nextIndex].id;
              nextIndex = (nextIndex + 1) % targetPool.length;
            }

            const newLead = {
              id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name,
              phone,
              email: email || '',
              property_name: formName,
              property_bg: 'bg-blue-600',
              status: 'new',
              created_at: lead.created_time || new Date().toISOString(),
              last_activity_at: new Date().toISOString(),
              assigned_broker_id: assignedBrokerId,
              notes: [`Lead importado via sincronização da Meta Ads (Formulário: ${formName}, ID Meta: ${leadgenId}).`]
            };

            const { error: insertErr } = await supabase.from('leads').insert(newLead);
            if (!insertErr) {
              createdLeadsCount++;
              importedDetails.push({ name, phone, status: 'criado', corretor: assignedBrokerId });
              // Adicionar ao array em memória para evitar duplicar caso o mesmo lead apareça em mais de um formulário
              existingLeads?.unshift(newLead);
            }
          }
        }
      }
    }

    if (createdLeadsCount === 0 && updatedLeadsCount === 0 && metaErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: `A Meta API retornou aviso/erro ao consultar os leads:\n\n${metaErrors.join('\n')}\n\nPossíveis causas:\n1. O token de acesso (FACEBOOK_PAGE_ACCESS_TOKEN) não possui a permissão 'leads_retrieval'.\n2. O Usuário do Sistema da Meta não tem acesso concedido a esta Página ou Formulários no Meta Business Suite.`
      }, { status: 400 });
    }

    if (totalFormsFound === 0) {
      return NextResponse.json({
        success: true,
        message: `Nenhum formulário de cadastro ativo foi retornado pela Meta para a Página configurada (ID: ${envPageId}).\n\nVerifique no Gerenciador de Anúncios se as campanhas estão ativas e vinculadas a formulários instantâneos desta página.`
      });
    }

    if (totalMetaLeadsFound === 0) {
      return NextResponse.json({
        success: true,
        message: `Foram consultados ${totalFormsFound} formulário(s) na Meta, porém não há nenhum lead cadastrado nestes formulários até o momento.\n\nAssim que os clientes preencherem os formulários nos anúncios, eles entrarão automaticamente no CRM.`
      });
    }

    if (createdLeadsCount === 0 && updatedLeadsCount > 0) {
      return NextResponse.json({
        success: true,
        message: `Sincronização concluída!\n\nForam encontrados ${totalMetaLeadsFound} lead(s) na Meta. Todos os ${updatedLeadsCount} lead(s) já estavam previamente cadastrados no CRM e tiveram seu histórico/status confirmados com sucesso (nenhum lead novo pendente).`,
        details: importedDetails
      });
    }

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída com sucesso!\n\n• ${createdLeadsCount} novo(s) lead(s) importado(s) e distribuído(s) aos corretores.\n• ${updatedLeadsCount} lead(s) existente(s) atualizado(s).`,
      details: importedDetails
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
