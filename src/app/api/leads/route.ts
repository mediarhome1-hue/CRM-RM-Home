import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder-url.supabase.co', supabaseKey || 'placeholder-key');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email, propertyName, propertyBg } = body;

    // 1. Validação básica de entrada
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'O nome é obrigatório.' }, { status: 400 });
    }

    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      return NextResponse.json(
        { error: 'Insira um número de WhatsApp válido com DDD (ex: 81 99999-9999).' },
        { status: 400 }
      );
    }

    const safePropertyName = (propertyName || 'Imóvel Site Líder').trim();
    const safePropertyBg = propertyBg || 'bg-[#00a0e3]';

    // 2. Carregar corretores do Supabase para saber quem está online no momento
    const { data: users, error: usersErr } = await supabase.from('users_crm').select('*');
    if (usersErr) {
      console.error('[API Leads] Erro ao buscar usuários no Supabase:', usersErr.message);
    }

    // 3. Verificação de Duplicidade indexada por telefone no Supabase (últimos 8 dígitos)
    const phoneSuffix = cleanPhone.slice(-8);
    const { data: matchedLeads } = await supabase
      .from('leads')
      .select('*')
      .ilike('phone', `%${phoneSuffix}%`)
      .limit(5);

    const existingLead = matchedLeads?.find(l => {
      const cleanLeadPhone = (l.phone || '').replace(/\D/g, '');
      if (!cleanPhone || !cleanLeadPhone) return false;
      if (cleanPhone === cleanLeadPhone) return true;
      if (cleanPhone.length >= 8 && cleanLeadPhone.length >= 8) {
        return cleanPhone.endsWith(cleanLeadPhone) || cleanLeadPhone.endsWith(cleanPhone);
      }
      return false;
    });

    if (existingLead) {
      // Atualizar histórico do lead duplicado e mantê-lo com o corretor original
      const updatedNotes = [
        ...(existingLead.notes || []),
        `Nova tentativa de contato pelo site para o imóvel: ${safePropertyName} em ${new Date().toLocaleString('pt-BR')}. Mantido com o corretor original.`
      ];

      const { error: updateErr } = await supabase
        .from('leads')
        .update({
          notes: updatedNotes,
          status: 'new',
          property_name: safePropertyName,
          property_bg: safePropertyBg,
          last_activity_at: new Date().toISOString(),
          attended_at: null
        })
        .eq('id', existingLead.id);

      if (updateErr) {
        console.error('[API Leads] Erro ao atualizar lead existente:', updateErr.message);
      }

      const assignedBroker = users?.find(u => u.id === existingLead.assigned_broker_id) || null;

      // Disparo assíncrono de notificação no WhatsApp informando nova interação do cliente
      if (assignedBroker && assignedBroker.phone) {
        const textNotification = `🚨 *NOVA INTERAÇÃO DE CLIENTE NO SITE LÍDER!*\n\n👤 *Cliente:* ${name}\n📱 *Contato:* ${phone}\n🏠 *Novo Interesse:* ${safePropertyName}\n\n👉 Acesse o CRM para atender: https://www.liderimobiliariape.com.br/dashboard`;
        const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.liderimobiliariape.com.br'}/api/whatsapp/send`;

        fetch(notifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: existingLead.id,
            to: assignedBroker.phone,
            text: textNotification
          })
        }).catch(err => console.error('[API Leads] Erro ao notificar no WhatsApp:', err));
      }

      return NextResponse.json({
        success: true,
        isDuplicate: true,
        lead: existingLead,
        broker: assignedBroker ? {
          id: assignedBroker.id,
          name: assignedBroker.name,
          avatar: assignedBroker.avatar,
          role: assignedBroker.role,
          creci: assignedBroker.creci,
          bio: assignedBroker.bio,
          phone: assignedBroker.phone
        } : null
      });
    }

    // 4. Seleção Justa via Round-Robin de Corretores
    const brokers = users?.filter(u => u.role === 'broker') || [];
    const onlineBrokers = brokers.filter(u => u.status === 'online');
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

    const assignedBroker = targetPool.length > 0 ? targetPool[nextIndex] : null;
    const assignedBrokerId = assignedBroker ? assignedBroker.id : 'diretoria-lider';

    // 5. Inserir novo Lead no Supabase
    const newLead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      property_name: safePropertyName,
      property_bg: safePropertyBg,
      status: 'new',
      created_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      assigned_broker_id: assignedBrokerId,
      notes: [`Lead gerado pelo formulário da sessão de imóveis do site (${safePropertyName}). Atribuído automaticamente.`]
    };

    const { error: insertErr } = await supabase.from('leads').insert(newLead);
    if (insertErr) {
      console.error('[API Leads] Erro ao inserir lead no Supabase:', insertErr.message);
      return NextResponse.json({ error: 'Erro ao registrar lead no banco de dados.' }, { status: 500 });
    }

    console.log(`[API Leads] Novo lead do site criado: "${name}" -> Atribuído para: ${assignedBrokerId}`);

    // 6. Notificar corretor via WhatsApp no backend
    if (assignedBroker && assignedBroker.phone) {
      const textNotification = `🚨 *NOVO LEAD DO SITE LÍDER!*\n\n👤 *Cliente:* ${name}\n📱 *Contato:* ${phone}\n🏠 *Interesse:* ${safePropertyName}\n\n👉 Acesse o CRM para atender: https://www.liderimobiliariape.com.br/dashboard`;
      const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.liderimobiliariape.com.br'}/api/whatsapp/send`;

      fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: newLead.id,
          to: assignedBroker.phone,
          text: textNotification
        })
      }).catch(err => console.error('[API Leads] Erro ao disparar WhatsApp:', err));
    }

    return NextResponse.json({
      success: true,
      isDuplicate: false,
      lead: newLead,
      broker: assignedBroker ? {
        id: assignedBroker.id,
        name: assignedBroker.name,
        avatar: assignedBroker.avatar,
        role: assignedBroker.role,
        creci: assignedBroker.creci,
        bio: assignedBroker.bio,
        phone: assignedBroker.phone
      } : null
    });

  } catch (error: any) {
    console.error('[API Leads] Erro inesperado:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}
