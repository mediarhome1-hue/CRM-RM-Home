import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder-url.supabase.co', supabaseKey || 'placeholder-key');

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
    console.log('Webhook do Facebook Lead Ads recebido:', JSON.stringify(body, null, 2));

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (changes?.field !== 'leadgen' || !value?.leadgen_id) {
      return NextResponse.json({ success: true, info: 'Sem dados de leadgen para processar.' });
    }

    const leadgenId = value.leadgen_id;
    const pageId = value.page_id;
    const formId = value.form_id;

    // Token da página para consulta na API do Graph da Meta
    const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageAccessToken) {
      console.error('[Facebook Webhook] FACEBOOK_PAGE_ACCESS_TOKEN não configurado.');
      return NextResponse.json({ error: 'Token de acesso da página não configurado.' }, { status: 500 });
    }

    // Buscar detalhes do lead na Graph API da Meta
    const metaUrl = `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${pageAccessToken}`;
    const response = await fetch(metaUrl);

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Facebook Webhook] Erro ao buscar lead na Graph API:', errText);
      return NextResponse.json({ error: `Meta API error: ${errText}` }, { status: 502 });
    }

    const leadData = await response.json();
    console.log('[Facebook Webhook] Detalhes do lead recebidos da Meta:', JSON.stringify(leadData, null, 2));

    // Extrair os campos do lead (nome, telefone, email)
    const fieldData = leadData.field_data || [];
    let name = '';
    let phone = '';
    let email = '';

    for (const field of fieldData) {
      const fieldName = field.name.toLowerCase();
      const fieldValue = field.values?.[0] || '';

      if (fieldName === 'full_name' || fieldName === 'name' || fieldName === 'nome' || fieldName === 'nome_completo') {
        name = fieldValue;
      } else if (fieldName === 'phone_number' || fieldName === 'phone' || fieldName === 'telefone' || fieldName === 'whatsapp') {
        phone = fieldValue;
      } else if (fieldName === 'email' || fieldName === 'e-mail') {
        email = fieldValue;
      }
    }

    // Sanitizar e validar dados obrigatórios
    if (!name) name = 'Lead Facebook';
    if (!phone) {
      console.warn('[Facebook Webhook] Lead recebido sem telefone. Ignorando.');
      return NextResponse.json({ success: true, info: 'Lead sem telefone ignorado.' });
    }

    // Buscar o nome do formulário (opcional) para registrar como origem
    let formName = 'Facebook Lead Ads';
    try {
      const formUrl = `https://graph.facebook.com/v20.0/${formId}?access_token=${pageAccessToken}`;
      const formRes = await fetch(formUrl);
      if (formRes.ok) {
        const formData = await formRes.json();
        if (formData.name) {
          formName = formData.name;
        }
      }
    } catch (err) {
      console.error('Erro ao buscar nome do formulário da Meta:', err);
    }

    // Buscar todos os leads no Supabase para ver se o telefone corresponde
    const { data: existingLeads, error: findErr } = await supabase
      .from('leads')
      .select('*');

    if (findErr) {
      console.error('Erro ao consultar leads no Supabase:', findErr.message);
      return NextResponse.json({ error: 'Erro ao consultar leads' }, { status: 500 });
    }

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
      // Sincronizar o lead duplicado no Supabase
      const updatedNotes = [
        ...matchedLead.notes,
        `Nova tentativa de contato via Facebook Lead Ads (Formulário: ${formName}) em ${new Date().toLocaleString('pt-BR')}. Mantido com o corretor original.`
      ];

      const { error: updateErr } = await supabase
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

      if (updateErr) {
        console.error('Erro ao atualizar lead duplicado no Supabase:', updateErr.message);
        return NextResponse.json({ error: 'Erro ao atualizar lead no banco' }, { status: 500 });
      }

      console.log(`[Facebook Webhook] Lead duplicado "${matchedLead.name}" atualizado com sucesso no Supabase.`);
      return NextResponse.json({ success: true, leadId: matchedLead.id, isDuplicate: true });
    }

    // --- ENCAMINHAMENTO ROUND-ROBIN ---
    // Buscar todos os usuários do Supabase
    const { data: users, error: usersErr } = await supabase
      .from('users_crm')
      .select('*');

    if (usersErr) {
      console.error('Erro ao consultar usuários no Supabase:', usersErr.message);
      return NextResponse.json({ error: 'Erro ao buscar usuários do CRM' }, { status: 500 });
    }

    // Filtrar corretores online
    const onlineBrokers = users?.filter(u => u.role === 'broker' && u.status === 'online') || [];
    let assignedBrokerId = 'diretoria-lider';

    if (onlineBrokers.length > 0) {
      // Escolha rotativa simples (aleatória entre online para simular round robin no backend)
      assignedBrokerId = onlineBrokers[Math.floor(Math.random() * onlineBrokers.length)].id;
    } else {
      // Se ninguém online, distribui entre qualquer corretor
      const allBrokers = users?.filter(u => u.role === 'broker') || [];
      if (allBrokers.length > 0) {
        assignedBrokerId = allBrokers[Math.floor(Math.random() * allBrokers.length)].id;
      } else if (users && users.length > 0) {
        assignedBrokerId = users[0].id;
      }
    }

    // Criar o novo lead
    const newLead = {
      id: `lead-${Date.now()}`,
      name,
      phone,
      email: email || '',
      property_name: formName,
      property_bg: 'bg-blue-600',
      status: 'new',
      created_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      assigned_broker_id: assignedBrokerId,
      notes: [`Lead gerado pelo Facebook Lead Ads (Formulário: ${formName}) em ${new Date().toLocaleString('pt-BR')}. Atribuído automaticamente.`]
    };

    const { error: insertErr } = await supabase
      .from('leads')
      .insert(newLead);

    if (insertErr) {
      console.error('Erro ao inserir novo lead no Supabase:', insertErr.message);
      return NextResponse.json({ error: 'Erro ao salvar novo lead no banco' }, { status: 500 });
    }

    console.log(`[Facebook Webhook] Novo lead "${name}" inserido com sucesso e atribuído a ${assignedBrokerId}.`);
    return NextResponse.json({ success: true, leadId: newLead.id, isDuplicate: false });

  } catch (error: any) {
    console.error('Erro no processamento do webhook do Facebook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
