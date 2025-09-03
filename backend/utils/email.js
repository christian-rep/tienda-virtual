const nodemailer = require('nodemailer');

// Configuración del transporter de nodemailer con Mailtrap
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "beb1e132177614",
    pass: "481cb458328f7e"
  }
});

// Función para enviar emails
exports.enviarEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: '"EcoShop" <noreply@ecoshop.com>',
      to,
      subject,
      text,
      html: html || text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw error;
  }
}; 