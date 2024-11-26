// mailer.js
const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services like Yahoo, Outlook, etc.
  auth: {
    user: 'your-email@gmail.com', // Your email address
    pass: 'your-email-password' // Your email password or app-specific password
  }
});

// Function to send the password reset email
const sendPasswordResetEmail = (to, token) => {
  const resetLink = `http://localhost:3000/reset-password/${token}`; // Adjust the URL as needed

  const mailOptions = {
    from: 'your-email@gmail.com',
    to,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}`,
    html: `<p>You requested a password reset. Click the link below to reset your password:</p><a href="${resetLink}">Reset Password</a>`
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };
