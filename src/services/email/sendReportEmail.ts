import nodemailer from 'nodemailer';

type Attachment = {
  filename: string;
  content: Buffer;
};

export async function sendReportEmail(params: {
  from: string;
  to: string;
  subject: string;
  text: string;
  attachments?: Attachment[];
}) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.seudominio.com', // 🔴 ajuste
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  await transporter.sendMail({
    from: params.from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    attachments: params.attachments,
  });
}
