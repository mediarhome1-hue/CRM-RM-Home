import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente do Supabase do lado do servidor com a chave de serviço ou anon key
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

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'crm_lider_token_default';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook do WhatsApp verificado com sucesso pelo Meta.');
      return new Response(challenge, { status: 200 });
    }

    console.warn('Tentativa de verificação do Webhook com token inválido.');
    return new Response('Forbidden', { status: 403 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. Recebimento de Mensagens Enviadas pelos Clientes (POST)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Webhook do WhatsApp recebido:', JSON.stringify(body, null, 2));

    // Validar se é uma mensagem válida do WhatsApp Business API
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];
    const contactInfo = value?.contacts?.[0];

    if (!message) {
      // É uma atualização de status ou outro tipo de evento, ignorar
      return NextResponse.json({ success: true, info: 'Sem mensagens novas' });
    }

    // Identificadores segundo o novo padrão BSUID da Meta
    const rawFromPhone = message.from || contactInfo?.wa_id || ''; // Número de telefone (ex: "5581999999999")
    const bsuid = message.from_user_id || contactInfo?.user_id || ''; // Business-scoped user ID (ex: "BR.13491208655...")
    const username = contactInfo?.profile?.username || ''; // Username opcional (@username)
    const profileName = contactInfo?.profile?.name || ''; // Nome de exibição no WhatsApp

    const cleanFromPhone = rawFromPhone.replace(/\D/g, ''); // Apenas números

    // Buscar todos os leads no Supabase para ver se o telefone ou BSUID corresponde
    const { data: leads, error: leadsErr } = await supabase
      .from('leads')
      .select('id, name, phone');

    if (leadsErr) {
      console.error('Erro ao consultar leads no Supabase:', leadsErr.message);
      return NextResponse.json({ error: 'Erro ao consultar leads' }, { status: 500 });
    }

    // Filtro de correspondência de número (comparação de sufixo ou BSUID se disponível)
    const matchedLead = leads?.find(l => {
      const cleanLeadPhone = l.phone.replace(/\D/g, '');
      if (cleanFromPhone && cleanLeadPhone) {
        return (
          cleanFromPhone.endsWith(cleanLeadPhone) || 
          cleanLeadPhone.endsWith(cleanFromPhone) ||
          cleanFromPhone === cleanLeadPhone
        );
      }
      return false;
    });

    // Filtro de Privacidade: Ignorar se não for um lead cadastrado
    if (!matchedLead) {
      console.log(`[WhatsApp Webhook] Mensagem ignorada de ${rawFromPhone || bsuid} (Contato não cadastrado no CRM).`);
      return NextResponse.json({ success: true, status: 'ignored', reason: 'number_not_in_crm' });
    }

    // Extrair o texto da mensagem ou contato compartilhado (REQUEST_CONTACT_INFO)
    let messageText = '[Mensagem de Mídia ou Outro Formato]';
    if (message.type === 'text') {
      messageText = message.text.body;
    } else if (message.type === 'button') {
      messageText = message.button.text;
    } else if (message.type === 'interactive') {
      messageText = message.interactive.button_reply?.title || message.interactive.list_reply?.title || messageText;
    } else if (message.type === 'contacts') {
      const sharedPhone = message.contacts?.[0]?.phones?.[0]?.phone || '';
      messageText = `📱 Contato compartilhado pelo cliente: ${sharedPhone}`;
    }

    const timestamp = new Date(parseInt(message.timestamp) * 1000).toISOString();

    // Inserir a mensagem na tabela de histórico vinculada ao lead
    const { error: insertErr } = await supabase.from('messages').insert({
      id: message.id || `msg-${Date.now()}`,
      lead_id: matchedLead.id,
      sender: 'client',
      text: messageText,
      timestamp,
      status: 'received'
    });

    if (insertErr) {
      console.error('Erro ao salvar mensagem recebida no banco:', insertErr.message);
      return NextResponse.json({ error: 'Erro ao salvar mensagem' }, { status: 500 });
    }

    console.log(`[WhatsApp Webhook] Mensagem de "${matchedLead.name}" (${username ? `@${username}` : rawFromPhone}) salva com sucesso.`);

    return NextResponse.json({ success: true, status: 'saved', leadId: matchedLead.id });
  } catch (error: any) {
    console.error('Erro ao processar webhook do WhatsApp:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
