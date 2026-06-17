import { UserCRM } from './leadsStore';

const sendEmail = async (to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.error || `Erro HTTP ${response.status}` };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Falha ao enviar requisição HTTP para o serviço de e-mail:', e);
    return { success: false, error: e.message || 'Erro de rede ou conexão com o servidor' };
  }
};

// Layout padrão de email com a identidade visual da Líder Imobiliária
const getBaseHtml = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background-color: #3159C1; padding: 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
    .content { padding: 40px; color: #334155; line-height: 1.6; }
    .content h2 { color: #0f172a; margin-top: 0; font-size: 20px; font-weight: 800; }
    .content p { font-size: 15px; font-weight: 500; }
    .detail-card { background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; margin: 24px 0; }
    .detail-item { font-size: 14px; margin: 10px 0; color: #475569; font-weight: 500; }
    .detail-item strong { color: #0f172a; }
    .button { display: inline-block; background-color: #3159C1; color: #ffffff !important; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; text-align: center; margin-top: 10px; }
    .button:hover { background-color: #234294; }
    .footer { text-align: center; padding: 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://www.liderimobiliariape.com.br/logotipo-lider-branco.png" alt="Líder Imobiliária" style="height: 50px; width: auto; max-width: 100%; display: block; margin: 0 auto;" />
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      Este é um e-mail automático enviado pelo CRM da Líder Imobiliária.<br>
      © ${new Date().getFullYear()} Líder Imobiliária. Todos os direitos reservados.
    </div>
  </div>
</body>
</html>
`;

/**
 * Envia notificação de alteração de dados do perfil próprio
 */
export const sendProfileUpdateEmail = async (user: UserCRM, updatedFields: string[]): Promise<{ success: boolean; error?: string }> => {
  const fieldsText = updatedFields.map(field => `<li><strong>${field}</strong></li>`).join('');
  const html = getBaseHtml(
    'Alerta de Segurança: Perfil Atualizado',
    `
    <h2>Olá, ${user.name}!</h2>
    <p>Detectamos que dados importantes do seu perfil cadastral no CRM Líder foram modificados recentemente. Esta é uma notificação automática para sua segurança.</p>
    
    <div class="detail-card">
      <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Campos Modificados</h3>
      <ul style="padding-left: 20px; margin: 0; font-size: 14px; color: #475569;">
        ${fieldsText}
      </ul>
    </div>
    
    <p>Se foi você quem fez essa alteração, nenhuma ação é necessária. Caso não reconheça essa atividade, entre em contato imediatamente com a direção geral do CRM Líder para proteger seu acesso.</p>
    <br>
    <div style="text-align: center;">
      <a href="https://www.liderimobiliariape.com.br/login" class="button">Acessar CRM</a>
    </div>
    `
  );

  return sendEmail(user.email, 'Alerta de Segurança - Dados Cadastrais Atualizados', html);
};

/**
 * Envia credenciais redefinidas ou criadas para o usuário
 */
export const sendPasswordResetEmail = async (user: UserCRM, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  const html = getBaseHtml(
    'Suas Credenciais Foram Redefinidas',
    `
    <h2>Olá, ${user.name}!</h2>
    <p>Sua senha de acesso ao CRM da Líder Imobiliária foi redefinida pela Diretoria Administrativa. Suas novas credenciais estão listadas abaixo.</p>
    
    <div class="detail-card">
      <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Credenciais de Acesso</h3>
      <div class="detail-item"><strong>E-mail de Login:</strong> ${user.email}</div>
      <div class="detail-item"><strong>Nova Senha Temporária:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 15px;">${newPassword}</span></div>
      <div class="detail-item"><strong>Cargo / Permissão:</strong> ${
        user.role === 'admin' ? 'Diretoria / Admin' : 
        user.role === 'manager' ? 'Gerência' : 'Consultor Corretor'
      }</div>
    </div>
    
    <p style="color: #e11d48; font-weight: bold; font-size: 13px;">Recomendação de segurança: Entre no sistema utilizando as credenciais acima e redefina sua senha para uma de sua preferência na aba "Minha Conta".</p>
    <br>
    <div style="text-align: center;">
      <a href="https://www.liderimobiliariape.com.br/login" class="button">Logar no CRM</a>
    </div>
    `
  );

  return sendEmail(user.email, 'CRM Líder - Suas Credenciais Foram Atualizadas', html);
};
