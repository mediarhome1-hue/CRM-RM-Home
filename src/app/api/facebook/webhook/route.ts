import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder-url.supabase.co', supabaseKey || 'placeholder-key');
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cache em memória na instância serverless para acelerar consultas e evitar requisições repetidas ao Meta
const pageTokensCache = new Map<string, string>();

async function getPageAccessToken(rawToken: string, pageId: string): Promise<string> {
  if (pageTokensCache.has(pageId)) {
    return pageTokensCache.get(pageId)!;
  }

  // 1. Tentar consultar diretamente /{pageId}?fields=access_token
  try {
    const pageUrl = `https://graph.facebook.com/v20.0/${pageId}?fields=access_token,name&access_token=${rawToken}`;
    const pageRes = await fetch(pageUrl);
    if (pageRes.ok) {
      const pageData = await pageRes.json();
      if (pageData.access_token) {
        pageTokensCache.set(pageId, pageData.access_token);
        return pageData.access_token;
      }
    }
  } catch (err) {
    console.warn(`[Facebook Webhook] Falha ao consultar /{pageId}:`, err);
  }

  // 2. Tentar consultar via /me/accounts
  try {
    const meUrl = `https://graph.facebook.com/v20.0/me/accounts?access_token=${rawToken}`;
    const meRes = await fetch(meUrl);
    if (meRes.ok) {
      const meData = await meRes.json();
      const accounts = meData.data || [];
      const match = accounts.find((p: any) => p.id === pageId);
      if (match?.access_token) {
        pageTokensCache.set(pageId, match.access_token);
        return match.access_token;
      }
      if (accounts[0]?.access_token) {
        pageTokensCache.set(pageId, accounts[0].access_token);
        return accounts[0].access_token;
      }
    }
  } catch (err) {
    console.warn(`[Facebook Webhook] Falha ao consultar /me/accounts:`, err);
  }

  // 3. Fallback: usar o próprio token configurado
  pageTokensCache.set(pageId, rawToken);
  return rawToken;
}

// 1. Validação do Webhook pelo Meta (GET)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const verifyToken = process.env.FACEBOOK_VERIFY_TOKEN || 'crm_lider_facebook_token';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook do Facebook verificado com sucesso pelo Meta.');
      return new Response(challenge, { status: 200 });
    }

    console.warn('Tentativa de verificação do Webhook do Facebook com token inválido.');
    return new Response('Forbidden', { status: 403 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. Recebimento de Mensagens Enviadas pelo Facebook Lead Ads (POST)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[Facebook Webhook] Payload bruto recebido da Meta:', JSON.stringify(body, null, 2));

    const rawToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
    if (!rawToken) {
      console.error('[Facebook Webhook] Token de acesso não configurado na Vercel.');
      return NextResponse.json({ error: 'Token de acesso não configurado.' }, { status: 500 });
    }

    // Extrair todas as mudanças de leadgen de todos os entries (suporte a leads simultâneos e em lote)
    const entries = body.entry || [];
    const leadChanges: Array<{ leadgenId: string; pageId: string; formId: string }> = [];

    for (const entry of entries) {
      const pageId = entry.id || '';
      for (const change of entry.changes || []) {
        if (change.field === 'leadgen' && change.value?.leadgen_id) {
          leadChanges.push({
            leadgenId: change.value.leadgen_id,
            pageId: change.value.page_id || pageId || process.env.FACEBOOK_PAGE_ID || '648684245476381',
            formId: change.value.form_id || ''
          });
        }
      }
    }

    if (leadChanges.length === 0) {
      return NextResponse.json({ success: true, info: 'Sem eventos de leadgen para processar.' });
    }

    // Carregar corretores e estado inicial do Round-Robin UMA ÚNICA VEZ
    const { data: users, error: usersErr } = await supabase.from('users_crm').select('*');
    if (usersErr) {
      console.error('[Facebook Webhook] Erro ao consultar usuários no Supabase:', usersErr.message);
    }

    const brokers = users?.filter(u => u.role === 'broker') || [];
    const nowMs = Date.now();
    const onlineBrokers = brokers.filter(u => {
      if (u.status !== 'online') return false;
      if (!u.last_online_at) return false;
      const lastActive = new Date(u.last_online_at).getTime();
      return (nowMs - lastActive) <= 60000;
    });
    const targetPool = onlineBrokers.length > 0 ? onlineBrokers : (brokers.length > 0 ? brokers : users || []);

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

    const processedResults: any[] = [];
    const formsCache = new Map<string, string>();

    // Processar cada lead individualmente (mesmo que tenham chegado no mesmo segundo)
    for (const item of leadChanges) {
      const { leadgenId, pageId, formId } = item;
      const pageAccessToken = await getPageAccessToken(rawToken, pageId);

      // 1. Buscar dados do lead na Graph API da Meta
      const metaUrl = `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${pageAccessToken}`;
      const response = await fetch(metaUrl);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Facebook Webhook] Erro ao buscar lead ${leadgenId} na Graph API:`, errText);
        processedResults.push({ leadgenId, error: errText });
        continue;
      }

      const leadData = await response.json();
      const fieldData = leadData.field_data || [];
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
      if (!phone || phone.includes('dummy') || name.includes('dummy')) {
        console.warn(`[Facebook Webhook] Lead ${leadgenId} de teste dummy ignorado para evitar poluição do banco.`);
        processedResults.push({ leadgenId, ignored: 'Lead de teste dummy' });
        continue;
      }

      // 2. Buscar o nome do formulário (com cache em memória para evitar chamadas duplicadas)
      let formName = formsCache.get(formId) || 'Facebook Lead Ads';
      if (formId && !formsCache.has(formId)) {
        try {
          const formUrl = `https://graph.facebook.com/v20.0/${formId}?access_token=${pageAccessToken}`;
          const formRes = await fetch(formUrl);
          if (formRes.ok) {
            const formData = await formRes.json();
            if (formData.name) {
              formName = formData.name;
              formsCache.set(formId, formName);
            }
          }
        } catch (err) {
          console.warn(`[Facebook Webhook] Erro ao buscar nome do formulário ${formId}:`, err);
        }
      }

      // 3. Checagem rápida de duplicidade no Supabase indexada pelos últimos 8 dígitos (evita carregar tabela inteira)
      const cleanPhone = phone.replace(/\D/g, '');
      const phoneSuffix = cleanPhone.slice(-8);

      const { data: matchedLeads } = await supabase
        .from('leads')
        .select('id, name, phone, notes, status, property_name')
        .ilike('phone', `%${phoneSuffix}%`)
        .limit(5);

      const matchedLead = matchedLeads?.find(l => {
        const cleanLeadPhone = (l.phone || '').replace(/\D/g, '');
        if (!cleanPhone || !cleanLeadPhone) return false;
        if (cleanPhone === cleanLeadPhone) return true;
        if (cleanPhone.length >= 8 && cleanLeadPhone.length >= 8) {
          return cleanPhone.endsWith(cleanLeadPhone) || cleanLeadPhone.endsWith(cleanPhone);
        }
        return false;
      });

      if (matchedLead) {
        // Atualizar lead existente mantendo o corretor original
        const updatedNotes = [
          ...(matchedLead.notes || []),
          `Nova tentativa de contato via Meta Ads (Formulário: ${formName}, Lead ID: ${leadgenId}) em ${new Date().toLocaleString('pt-BR')}. Mantido com o corretor original.`
        ];

        await supabase
          .from('leads')
          .update({
            notes: updatedNotes,
            status: 'new',
            property_name: formName,
            property_bg: 'bg-blue-600',
            last_activity_at: new Date().toISOString(),
            attended_at: null
          })
          .eq('id', matchedLead.id);

        console.log(`[Facebook Webhook] Lead existente "${matchedLead.name}" atualizado.`);
        processedResults.push({ leadgenId, isDuplicate: true, leadId: matchedLead.id });
      } else {
        // Atribuir próximo corretor via Round-Robin sequencial garantido
        let assignedBrokerId = 'diretoria-lider';
        if (targetPool.length > 0) {
          assignedBrokerId = targetPool[nextIndex].id;
          // Avançar o ponteiro para o próximo lead simultâneo
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
          created_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
          assigned_broker_id: assignedBrokerId,
          notes: [`Lead gerado pelo Facebook Lead Ads (Formulário: ${formName}, ID Meta: ${leadgenId}) em ${new Date().toLocaleString('pt-BR')}. Atribuído automaticamente.`]
        };

        const { error: insertErr } = await supabase.from('leads').insert(newLead);
        if (insertErr) {
          console.error('[Facebook Webhook] Erro ao salvar novo lead no banco:', insertErr.message);
          processedResults.push({ leadgenId, error: insertErr.message });
          continue;
        }

        console.log(`[Facebook Webhook] Novo lead "${name}" criado com sucesso e atribuído a ${assignedBrokerId}.`);
        processedResults.push({ leadgenId, isDuplicate: false, leadId: newLead.id, assignedTo: assignedBrokerId });

        // Disparo assíncrono de notificação por WhatsApp (sem travar a resposta da requisição)
        const assignedUser = users?.find(u => u.id === assignedBrokerId);
        if (assignedUser && assignedUser.phone) {
          const textNotification = `🚨 *NOVO LEAD ATRIBUÍDO NO CRM LÍDER!*\n\n👤 *Cliente:* ${name}\n📱 *Contato:* ${phone}\n🏠 *Interesse:* ${formName}\n\n👉 Acesse o CRM para atender: https://www.liderimobiliariape.com.br/dashboard`;
          const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.liderimobiliariape.com.br'}/api/whatsapp/send`;

          fetch(notifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leadId: newLead.id,
              to: assignedUser.phone,
              text: textNotification
            })
          }).catch(err => console.error('[Facebook Webhook] Erro ao enviar notificação WhatsApp:', err));
        }
      }
    }

    return NextResponse.json({ success: true, processed: processedResults });

  } catch (error: any) {
    console.error('[Facebook Webhook] Erro geral:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
