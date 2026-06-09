const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
      user: process.env.SMTP_USER || 'ethereal_user',
      pass: process.env.SMTP_PASS || 'ethereal_pass',
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || 'AI Mülakat Sistemi'} <${process.env.FROM_EMAIL || 'noreply@aimulakat.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);

  if (process.env.NODE_ENV === 'development') {
    console.log('E-posta gönderildi: %s', info.messageId);
    // Eğer ethereal email kullanılıyorsa önizleme linkini göster:
    console.log('Önizleme URL: %s', nodemailer.getTestMessageUrl(info));
  }
};

module.exports = sendEmail;
