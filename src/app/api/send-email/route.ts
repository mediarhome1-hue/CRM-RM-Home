import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Parâmetros "to", "subject" e "html" são obrigatórios.' },
        { status: 400 }
      );
    }

    let smtpUser = (process.env.SMTP_USER || 'medialiderimobiliaria@gmail.com').trim().replace(/^['"]|['"]$/g, '');
    let smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpPassword) {
      console.warn('Variável de ambiente SMTP_PASSWORD não configurada no servidor.');
      return NextResponse.json(
        { error: 'Credenciais SMTP (SMTP_PASSWORD) não configuradas no servidor Vercel. Verifique as Variáveis de Ambiente.' },
        { status: 500 }
      );
    }

    // Sanitizar a senha (remover aspas duplas, simples e espaços em branco que podem ter sido colados acidentalmente)
    smtpPassword = smtpPassword.trim().replace(/^['"]|['"]$/g, '');

    // Configurar transporte SMTP seguro com SSL (porta 465) do Gmail
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      connectionTimeout: 10000, // 10 segundos de timeout
    });

    // Validar a conexão SMTP antes de enviar para expor o erro exato de autenticação ou rede
    try {
      await transporter.verify();
    } catch (verifyError: any) {
      console.error('Falha na verificação de conexão/autenticação SMTP:', verifyError);
      return NextResponse.json(
        { error: `Falha de autenticação/conexão no Gmail SMTP: ${verifyError.message || verifyError}. Verifique se o e-mail está correto e se a Senha de App do Google foi gerada sem espaços.` },
        { status: 500 }
      );
    }

    // Enviar o e-mail
    const info = await transporter.sendMail({
      from: `"CRM RM Home" <${smtpUser}>`,
      to,
      subject,
      html,
    });

    console.log('E-mail enviado com sucesso via SMTP:', info.messageId);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Erro ao processar envio de e-mail:', error);
    return NextResponse.json(
      { error: error.message || 'Falha geral ao enviar e-mail por SMTP.' },
      { status: 500 }
    );
  }
}
