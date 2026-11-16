import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { INITIAL_USERS, isLegacyRemovedUser, UserCRM, UserRole } from '@/utils/leadsStore';

import { DEFAULT_SUPABASE_KEY, DEFAULT_SUPABASE_URL } from '@/utils/supabaseClient';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  DEFAULT_SUPABASE_KEY;

const isConfigured = !!(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('seu-projeto')
);

const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseKey || 'placeholder-key'
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Mapeia objeto UserCRM (camelCase) para linha do banco users_crm (snake_case)
function mapUserToDB(u: Partial<UserCRM> & { id: string }) {
  const row: Record<string, any> = {
    id: u.id,
  };
  if (u.name !== undefined) row.name = u.name.trim();
  if (u.avatar !== undefined) row.avatar = u.avatar;
  if (u.role !== undefined) row.role = u.role;
  if (u.email !== undefined) row.email = u.email.trim().toLowerCase();
  if (u.phone !== undefined) row.phone = u.phone.trim();
  if (u.password !== undefined) row.password = u.password;
  if (u.isWhatsAppConnected !== undefined) row.is_whatsapp_connected = u.isWhatsAppConnected;
  if (u.status !== undefined) row.status = u.status;
  if (u.managerId !== undefined) row.manager_id = u.managerId || null;
  if (u.creci !== undefined) row.creci = u.creci ? u.creci.trim() : null;
  if (u.bio !== undefined) row.bio = u.bio ? u.bio.trim() : null;
  if (u.birthdate !== undefined) row.birthdate = u.birthdate || null;
  if (u.emailNotifications !== undefined) row.email_notifications = u.emailNotifications;
  if (u.lastOnlineAt !== undefined) row.last_online_at = u.lastOnlineAt || null;
  if (u.totalOnlineTime !== undefined) row.total_online_time = u.totalOnlineTime ?? 0;
  return row;
}

// Mapeia linha do banco users_crm (snake_case) para objeto UserCRM (camelCase)
function mapUserFromDB(row: any): UserCRM {
  return {
    id: row.id,
    name: row.name || '',
    avatar:
      row.avatar ||
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    role: (row.role as UserRole) || 'broker',
    email: (row.email || '').trim().toLowerCase(),
    phone: row.phone || '',
    password: row.password || '123',
    isWhatsAppConnected: Boolean(row.is_whatsapp_connected),
    status: row.status === 'online' ? 'online' : 'offline',
    managerId: row.manager_id || undefined,
    creci: row.creci || undefined,
    bio: row.bio || undefined,
    birthdate: row.birthdate || undefined,
    emailNotifications: row.email_notifications ?? true,
    lastOnlineAt: row.last_online_at || undefined,
    totalOnlineTime: Number(row.total_online_time || 0),
  };
}

// Colunas opcionais que podem não existir caso a migração SQL completa ainda não tenha sido rodada
const OPTIONAL_COLUMNS = [
  'birthdate',
  'email_notifications',
  'last_online_at',
  'total_online_time',
  'creci',
  'bio',
  'manager_id',
];

/**
 * Insere ou atualiza registro em `users_crm` com fallback automático caso alguma
 * coluna opcional ainda não exista no schema do Supabase.
 */
async function resilientUpsertUser(payload: Record<string, any>) {
  let currentPayload = { ...payload };

  for (let attempt = 0; attempt <= OPTIONAL_COLUMNS.length; attempt++) {
    const { data, error } = await supabase
      .from('users_crm')
      .upsert(currentPayload, { onConflict: 'id' })
      .select('*')
      .single();

    if (!error) {
      return { data, error: null };
    }

    // Verifica se o erro é de coluna inexistente no PostgREST (PGRST204 ou mensagem equivalente)
    const errMsg = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`;
    const missingCol = OPTIONAL_COLUMNS.find(
      (col) =>
        col in currentPayload &&
        (errMsg.includes(`'${col}'`) ||
          errMsg.includes(`"${col}"`) ||
          errMsg.includes(`.${col}`))
    );

    if (missingCol) {
      console.warn(
        `[API Users] Coluna opcional "${missingCol}" ausente no banco. Retentando sem ela...`
      );
      const nextPayload = { ...currentPayload };
      delete nextPayload[missingCol];
      currentPayload = nextPayload;
      continue;
    }

    return { data: null, error };
  }

  return supabase.from('users_crm').upsert(currentPayload, { onConflict: 'id' }).select('*').single();
}

/**
 * GET /api/users
 * Lista todos os usuários/corretores cadastrados no banco de dados.
 * Se a tabela estiver vazia, realiza o seed inicial automaticamente.
 */
export async function GET(req: Request) {
  try {
    if (!isConfigured) {
      return NextResponse.json({
        success: true,
        users: INITIAL_USERS,
        source: 'local-fallback',
      });
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role');

    let query = supabase.from('users_crm').select('*');
    if (roleFilter && ['admin', 'manager', 'broker'].includes(roleFilter)) {
      query = query.eq('role', roleFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[API Users GET] Erro ao buscar usuários no Supabase:', error.message);
      return NextResponse.json(
        { error: error.message, users: INITIAL_USERS, source: 'fallback-on-error' },
        { status: 500 }
      );
    }

    // Se o banco estiver completamente vazio e sem filtro, semeia os usuários iniciais
    if ((!data || data.length === 0) && !roleFilter) {
      const seeded: UserCRM[] = [];
      for (const initialUser of INITIAL_USERS) {
        const { data: inserted } = await resilientUpsertUser(
          mapUserToDB({
            ...initialUser,
            password: initialUser.password || '123',
          })
        );
        if (inserted) {
          seeded.push(mapUserFromDB(inserted));
        }
      }
      return NextResponse.json({
        success: true,
        users: seeded.length > 0 ? seeded : INITIAL_USERS,
        source: 'supabase-seeded',
      });
    }

    const allMapped = (data || []).map(mapUserFromDB);
    const legacyUsers = allMapped.filter((u) => isLegacyRemovedUser(u));

    if (legacyUsers.length > 0) {
      const legacyIds = legacyUsers.map((u) => u.id);
      await supabase
        .from('leads')
        .update({ assigned_broker_id: 'diretoria-lider' })
        .in('assigned_broker_id', legacyIds);
      await supabase.from('users_crm').delete().in('id', legacyIds);
    }

    let users = allMapped.filter((u) => !isLegacyRemovedUser(u));
    if (users.length === 0 && !roleFilter) {
      const adminUser = INITIAL_USERS[0];
      const { data: inserted } = await resilientUpsertUser(
        mapUserToDB({
          ...adminUser,
          password: adminUser.password || '81546223*#',
        })
      );
      users = [inserted ? mapUserFromDB(inserted) : adminUser];
    }

    return NextResponse.json({
      success: true,
      users,
      source: 'supabase',
    });
  } catch (error: any) {
    console.error('[API Users GET] Erro inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao listar usuários.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Cadastra um novo corretor, gerente ou administrador no banco de dados.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Ação administrativa: remover todos os usuários exceto Joseph Nascimento (Direção) e disparar boas-vindas
    if (body?.action === 'reset-to-admin') {
      const adminUser = INITIAL_USERS[0];

      if (isConfigured) {
        // 1. Reatribuir todos os leads para a Direção
        await supabase
          .from('leads')
          .update({ assigned_broker_id: 'diretoria-lider' })
          .neq('assigned_broker_id', 'diretoria-lider');

        // 2. Desvincular manager_id antes de remover
        await supabase.from('users_crm').update({ manager_id: null }).neq('id', 'diretoria-lider');

        // 3. Remover todos os usuários exceto Joseph Nascimento (diretoria-lider)
        await supabase.from('users_crm').delete().neq('id', 'diretoria-lider');

        // 4. Garantir cadastro atualizado de Joseph Nascimento (Direção)
        await resilientUpsertUser(
          mapUserToDB({
            ...adminUser,
            password: adminUser.password || '81546223*#',
          })
        );
      }

      let emailResult: { sent: boolean; messageId?: string; error?: string } = { sent: false };

      if (body?.sendWelcome !== false) {
        try {
          const smtpUser = (process.env.SMTP_USER || 'medialiderimobiliaria@gmail.com')
            .trim()
            .replace(/^['"]|['"]$/g, '');
          const smtpPassword = (process.env.SMTP_PASSWORD || '')
            .trim()
            .replace(/^['"]|['"]$/g, '');

          if (smtpPassword) {
            const transporter = nodemailer.createTransport({
              host: 'smtp.gmail.com',
              port: 465,
              secure: true,
              auth: { user: smtpUser, pass: smtpPassword },
              connectionTimeout: 10000,
            });

            const welcomeHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bem-vindo ao CRM RM Home Imobiliária!</title>
</head>
<body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="background-color: #001638; padding: 32px; text-align: center;">
      <img src="https://www.rmhomeimobiliaria.com/logotipo-rm-home-branco.png" alt="RM Home Imobiliária" style="height: 50px; width: auto; display: block; margin: 0 auto;" />
    </div>
    <div style="padding: 40px; color: #334155; line-height: 1.6;">
      <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 800;">Seja bem-vindo(a), ${adminUser.name}!</h2>
      <p>Seu acesso principal de <strong>Direção</strong> no <strong>CRM da RM Home Imobiliária</strong> está ativo e configurado. O banco de dados foi higienizado mantendo exclusivamente o seu perfil administrativo para o cadastro dos novos corretores da equipe.</p>
      <div style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; margin: 24px 0;">
        <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Suas Credenciais de Acesso</h3>
        <div style="font-size: 14px; margin: 10px 0; color: #475569;"><strong>E-mail de Login:</strong> ${adminUser.email}</div>
        <div style="font-size: 14px; margin: 10px 0; color: #475569;"><strong>Senha de Acesso:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${adminUser.password}</span></div>
        <div style="font-size: 14px; margin: 10px 0; color: #475569;"><strong>Perfil de Acesso:</strong> Diretoria / Admin</div>
      </div>
      <div style="text-align: center; margin-top: 24px;">
        <a href="https://www.rmhomeimobiliaria.com/login" style="display: inline-block; background-color: #001638; color: #ffffff; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Acessar a Plataforma CRM</a>
      </div>
    </div>
    <div style="text-align: center; padding: 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
      © ${new Date().getFullYear()} RM Home Imobiliária. Todos os direitos reservados.
    </div>
  </div>
</body>
</html>`;

            const info = await transporter.sendMail({
              from: `"CRM RM Home" <${smtpUser}>`,
              to: adminUser.email,
              subject: '🚀 Bem-vindo ao CRM RM Home Imobiliária - Acesso Direção',
              html: welcomeHtml,
            });
            emailResult = { sent: true, messageId: info.messageId };
          } else {
            emailResult = { sent: false, error: 'SMTP_PASSWORD não configurada no ambiente.' };
          }
        } catch (mailErr: any) {
          emailResult = { sent: false, error: mailErr.message };
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Banco de dados higienizado: apenas Joseph Nascimento (Direção) permanece cadastrado.',
        users: [adminUser],
        emailResult,
      });
    }

    const {
      id,
      name,
      email,
      phone,
      password,
      role = 'broker',
      avatar,
      managerId,
      creci,
      bio,
      birthdate,
      emailNotifications = true,
    } = body;

    // 1. Validações de campos obrigatórios
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'O nome completo do corretor/usuário é obrigatório.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Informe um endereço de e-mail válido.' },
        { status: 400 }
      );
    }

    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      return NextResponse.json(
        { error: 'Informe um número de WhatsApp válido com DDD (ex: 81 99999-9999).' },
        { status: 400 }
      );
    }

    const validRoles: UserRole[] = ['admin', 'manager', 'broker'];
    const safeRole: UserRole = validRoles.includes(role) ? role : 'broker';
    const normalizedEmail = email.trim().toLowerCase();

    const defaultAvatar =
      safeRole === 'manager'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
        : safeRole === 'admin'
        ? 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
        : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150';

    const newUser: UserCRM = {
      id: id && typeof id === 'string' ? id : `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: (password && String(password).trim()) || '123',
      role: safeRole,
      avatar: avatar && typeof avatar === 'string' && avatar.trim() ? avatar.trim() : defaultAvatar,
      isWhatsAppConnected: false,
      status: 'offline',
      managerId: safeRole === 'broker' && managerId ? managerId : undefined,
      creci: creci ? String(creci).trim() : undefined,
      bio: bio ? String(bio).trim() : undefined,
      birthdate: birthdate || undefined,
      emailNotifications: Boolean(emailNotifications),
      totalOnlineTime: 0,
    };

    if (!isConfigured) {
      return NextResponse.json(
        {
          success: true,
          user: newUser,
          warning: 'Supabase não configurado no servidor; usuário retornado para persistência local.',
        },
        { status: 201 }
      );
    }

    // 2. Verificar duplicidade de e-mail no banco (a menos que seja atualização do mesmo ID)
    const { data: existingByEmail } = await supabase
      .from('users_crm')
      .select('id, name, email')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (existingByEmail && existingByEmail.id !== newUser.id) {
      return NextResponse.json(
        {
          error: `Já existe um usuário cadastrado com o e-mail "${normalizedEmail}" (${existingByEmail.name}).`,
        },
        { status: 409 }
      );
    }

    // 3. Persistir no Supabase com fallback resiliente de colunas
    const dbPayload = mapUserToDB(newUser);
    const { data: inserted, error: insertErr } = await resilientUpsertUser(dbPayload);

    if (insertErr) {
      console.error('[API Users POST] Erro ao salvar corretor no Supabase:', insertErr);
      const isUniqueViolation =
        insertErr.code === '23505' || insertErr.message?.includes('duplicate key');
      return NextResponse.json(
        {
          error: isUniqueViolation
            ? `Este e-mail (${normalizedEmail}) já está em uso por outro usuário.`
            : `Erro ao salvar usuário no banco de dados: ${insertErr.message}`,
        },
        { status: isUniqueViolation ? 409 : 500 }
      );
    }

    const savedUser = inserted ? mapUserFromDB(inserted) : newUser;
    console.log(`[API Users POST] Novo usuário cadastrado: ${savedUser.name} (${savedUser.role}) [${savedUser.id}]`);

    return NextResponse.json(
      {
        success: true,
        user: savedUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API Users POST] Erro inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno no servidor ao cadastrar usuário.' },
      { status: 500 }
    );
  }
}

/**
 * PUT / PATCH /api/users
 * Atualiza dados cadastrais, cargo, senha, status online/offline ou WhatsApp de um corretor/usuário.
 */
export async function PUT(req: Request) {
  return handleUpdateUser(req);
}

export async function PATCH(req: Request) {
  return handleUpdateUser(req);
}

async function handleUpdateUser(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'O ID do usuário é obrigatório para atualização.' },
        { status: 400 }
      );
    }

    if (!isConfigured) {
      return NextResponse.json({
        success: true,
        user: { id, ...updates },
        source: 'local-fallback',
      });
    }

    // Buscar registro atual no banco para mesclar com segurança
    const { data: currentRow, error: fetchErr } = await supabase
      .from('users_crm')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      console.error('[API Users PATCH] Erro ao buscar usuário atual:', fetchErr.message);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    // Se e-mail foi alterado, verificar se já não pertence a outro usuário
    if (updates.email && typeof updates.email === 'string') {
      const normalizedEmail = updates.email.trim().toLowerCase();
      const { data: emailConflict } = await supabase
        .from('users_crm')
        .select('id, name')
        .ilike('email', normalizedEmail)
        .neq('id', id)
        .maybeSingle();

      if (emailConflict) {
        return NextResponse.json(
          {
            error: `O e-mail "${normalizedEmail}" já está cadastrado para o usuário ${emailConflict.name}.`,
          },
          { status: 409 }
        );
      }
    }

    const currentMapped: UserCRM = currentRow
      ? mapUserFromDB(currentRow)
      : {
          id,
          name: updates.name || 'Usuário CRM',
          avatar:
            updates.avatar ||
            'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
          role: updates.role || 'broker',
          email: updates.email || '',
          phone: updates.phone || '',
          password: updates.password || '123',
          isWhatsAppConnected: Boolean(updates.isWhatsAppConnected),
          status: updates.status || 'offline',
        };

    const mergedUser: UserCRM = {
      ...currentMapped,
      ...updates,
      id,
    };

    const dbPayload = mapUserToDB(mergedUser);
    const { data: updatedRow, error: updateErr } = await resilientUpsertUser(dbPayload);

    if (updateErr) {
      console.error('[API Users PATCH] Erro ao atualizar usuário no Supabase:', updateErr);
      return NextResponse.json(
        { error: `Erro ao atualizar usuário no banco: ${updateErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedRow ? mapUserFromDB(updatedRow) : mergedUser,
    });
  } catch (error: any) {
    console.error('[API Users PATCH] Erro inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao atualizar usuário.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users?id=...
 * Remove um corretor/usuário do CRM preservando todos os seus leads (transferindo-os para a diretoria ou fila geral).
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get('id');

    if (!userId) {
      const body = await req.json().catch(() => ({}));
      userId = body.id;
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'O ID do usuário a ser removido é obrigatório.' },
        { status: 400 }
      );
    }

    if (userId === 'diretoria-lider') {
      return NextResponse.json(
        { error: 'A conta principal da Diretoria não pode ser removida.' },
        { status: 403 }
      );
    }

    if (!isConfigured) {
      return NextResponse.json({ success: true, deletedId: userId, source: 'local-fallback' });
    }

    // 1. Preservar leads atribuídos ao corretor que será removido (evita perda caso FK antiga tenha ON DELETE CASCADE)
    await supabase
      .from('leads')
      .update({
        assigned_broker_id: 'diretoria-lider',
        last_activity_at: new Date().toISOString(),
      })
      .eq('assigned_broker_id', userId);

    // 2. Desvincular corretores que tinham este usuário como gerente
    await supabase
      .from('users_crm')
      .update({ manager_id: null })
      .eq('manager_id', userId);

    // 3. Excluir o usuário de users_crm
    const { error: deleteErr } = await supabase
      .from('users_crm')
      .delete()
      .eq('id', userId);

    if (deleteErr) {
      console.error('[API Users DELETE] Erro ao excluir usuário no Supabase:', deleteErr);
      return NextResponse.json(
        { error: `Erro ao excluir usuário do banco de dados: ${deleteErr.message}` },
        { status: 500 }
      );
    }

    console.log(`[API Users DELETE] Usuário removido com sucesso: ${userId}`);
    return NextResponse.json({ success: true, deletedId: userId });
  } catch (error: any) {
    console.error('[API Users DELETE] Erro inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao excluir usuário.' },
      { status: 500 }
    );
  }
}

