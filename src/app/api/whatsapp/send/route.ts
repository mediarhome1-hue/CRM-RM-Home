import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder-url.supabase.co', supabaseKey || 'placeholder-key');

export async function POST(req: Request) {
  try {
    const { leadId, to, text } = await req.json();

    if (!leadId || !to || !text) {
      return NextResponse.json(
        { error: 'Parâmetros "leadId", "to" e "text" são obrigatórios.' },
        { status: 400 }
      );
    }

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    const timestamp = new Date().toISOString();
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Se NÃO estiver configurado a API do WhatsApp na Meta, opera em Modo de Simulação
    if (!phoneNumberId || !accessToken) {
      console.warn('[WhatsApp Send] API da Meta não configurada. Operando em MODO SIMULADO.');

      // Salvar de forma simulada no banco de dados para o corretor ver a mensagem na tela
      const { error: insertErr } = await supabase.from('messages').insert({
        id: messageId,
        lead_id: leadId,
        sender: 'broker',
        text,
        timestamp,
        status: 'sent'
      });

      if (insertErr) {
        console.error('Erro ao salvar mensagem simulada no banco:', insertErr.message);
        return NextResponse.json({ error: 'Erro ao salvar mensagem no banco' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        simulated: true, 
        messageId, 
        info: 'Mensagem simulada salva no banco. API oficial não configurada.' 
      });
    }

    // --- ENVIO REAL VIA API DA META ---
    // Limpar e formatar o número de telefone para o padrão DDI + DDD + Número
    let cleanTo = to.replace(/\D/g, '');
    if (cleanTo.length === 11 && !cleanTo.startsWith('55')) {
      cleanTo = '55' + cleanTo;
    } else if (cleanTo.length === 10 && !cleanTo.startsWith('55')) {
      cleanTo = '55' + cleanTo;
    }

    const metaUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

    const response = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'text',
        text: {
          preview_url: false,
          body: text
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[WhatsApp Send] Erro retornado pela Meta:', errText);
      return NextResponse.json(
        { error: `Erro na Meta API: ${errText}` },
        { status: 502 }
      );
    }

    const resData = await response.json();
    const metaMessageId = resData.messages?.[0]?.id || messageId;

    // Salvar a mensagem no banco de dados com remetente 'broker'
    const { error: insertErr } = await supabase.from('messages').insert({
      id: metaMessageId,
      lead_id: leadId,
      sender: 'broker',
      text,
      timestamp,
      status: 'sent'
    });

    if (insertErr) {
      console.error('Erro ao salvar mensagem real enviada no banco:', insertErr.message);
      return NextResponse.json({ error: 'Erro ao salvar mensagem no banco de dados' }, { status: 500 });
    }

    console.log('[WhatsApp Send] Mensagem enviada e salva com sucesso:', metaMessageId);
    return NextResponse.json({ success: true, messageId: metaMessageId });

  } catch (error: any) {
    console.error('Erro ao enviar mensagem de WhatsApp:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao processar envio de mensagem.' },
      { status: 500 }
    );
  }
}
