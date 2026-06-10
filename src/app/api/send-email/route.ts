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

    const smtpUser = process.env.SMTP_USER || 'medialiderimobiliaria@gmail.com';
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpPassword) {
      console.warn('Variável de ambiente SMTP_PASSWORD não configurada no servidor.');
      return NextResponse.json(
        { error: 'Credenciais SMTP não configuradas no servidor.' },
        { status: 500 }
      );
    }

    // Configurar transporte SMTP seguro com SSL (porta 465) do Gmail
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    // Enviar o e-mail
    const info = await transporter.sendMail({
      from: `"CRM Líder" <${smtpUser}>`,
      to,
      subject,
      html,
    });

    console.log('E-mail enviado com sucesso via SMTP:', info.messageId);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Erro ao processar envio de e-mail:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao enviar e-mail por SMTP.' },
      { status: 500 }
    );
  }
}
