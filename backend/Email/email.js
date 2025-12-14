const nodemailer = require("nodemailer");

const sendWelcomeEmail = async (userName, userEmail, GMAIL_USER, GMAIL_PASS) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use true for TLS
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: GMAIL_USER,
    to: userEmail,
    subject: "Welcome to Our Service!",
    text: `Hello ${userName},\n\nThank you for signing up! We're excited to have you on board.`,
  });

  console.log("Welcome email sent:", info.messageId);
};

module.exports = { sendWelcomeEmail };
