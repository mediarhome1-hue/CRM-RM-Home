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

    // 1. Buscar formulários da página através do me/leadgen_forms ou buscar leads diretamente
    // Vamos buscar primeiro as contas/páginas associadas ao token
    const meRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${pageAccessToken}`);
    if (!meRes.ok) {
      const errText = await meRes.text();
      return NextResponse.json({ error: `Erro ao consultar páginas no Meta: ${errText}` }, { status: 502 });
    }

    const meData = await meRes.json();
    const pages = meData.data || [];

    if (pages.length === 0) {
      return NextResponse.json({ error: 'Nenhuma página do Facebook encontrada para este Token.' }, { status: 404 });
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
