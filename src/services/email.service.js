const nodemailer = require("nodemailer");

// Create a transporter using OAuth2 authentication
const transporter = nodemailer.createTransport({
  service: "Gmail", // e.g., 'Gmail', 'Yahoo', etc.
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Error configuring email transporter:", error);
  } else {
    console.log("Email transporter is configured and ready to send emails!");
  }
});

// Function to send an email
const sendEmail = async (to, subject, text, html) => {
  const mailOptions = {
    from: `"Backend Ledger" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // console.log('Email sent successfully:', info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

async function sendRegistrationEmail(to, name) {
  const subject = "Welcome to Backend Ledger!";
  const text = `Hi ${name},\n\nThank you for registering at Backend Ledger! We're excited to have you on board.\n\nBest regards,\nThe Backend Ledger Team`;
  const html = `<p>Hi ${name},</p><p>Thank you for registering at <strong>Backend Ledger</strong>! We're excited to have you on board.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

  await sendEmail(to, subject, text, html);
}

async function sendTransactionNotificationEmail(to, name, amount, toAccount) {
  const subject = "Transaction Successful!";
  const text = `Hi ${name},\n\nYour transaction of NPR${amount} to account ${toAccount} was successful!\n\nBest regards,\nThe Backend Ledger Team`;
  const html = `<p>Hi ${name},</p><p>Your transaction of <strong>NPR${amount}</strong> to account <strong>${toAccount}</strong> was successful!</p><p>Best regards,<br>The Backend Ledger Team</p>`;

  await sendEmail(to, subject, text, html);
}

async function sendTransactionFailureEmail(to, name, amount, toAccount) {
  const subject = "Transaction Failed!";
  const text = `Hi ${name},\n\nUnfortunately, your transaction of NPR${amount} to account ${toAccount} failed. Please try again later.\n\nBest regards,\nThe Backend Ledger Team`;
  const html = `<p>Hi ${name},</p><p>Unfortunately, your transaction of <strong>NPR${amount}</strong> to account <strong>${toAccount}</strong> failed. Please try again later.</p><p>Best regards,<br>The Backend Ledger Team</p>`;

  await sendEmail(to, subject, text, html);
}

module.exports = {
  sendRegistrationEmail,
  sendTransactionNotificationEmail,
  sendTransactionFailureEmail,
};
