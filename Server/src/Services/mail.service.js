const { createMailerTransport } = require("../config/mail");
const { cfg } = require("../config/config");

async function sendMail(toEmailValue, subjectValue, htmlValue) {
  try {
    const transporter = createMailerTransport();
    const fromEmail = cfg.FROM_EMAIL || cfg.MAIL_USER;
    await transporter.sendMail({
      from: `"Soukya Stacks" <${fromEmail}>`,
      to: toEmailValue,
      subject: subjectValue,
      html: htmlValue
    });
  } catch (error) {
    // Re-throw with more context
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

async function sendVerifyEmail(toEmailValue, verificationCode) {
  await sendMail(
    toEmailValue,
    "Verify your email - Verification Code",
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Hello,</p>
        <p>Thank you for signing up! Please use the following verification code to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 8px; margin: 0;">${verificationCode}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">Best regards,<br>Soukya Stacks Team</p>
      </div>
    `
  );
}

async function sendResetPasswordEmail(toEmailValue, resetUrlValue) {
  await sendMail(
    toEmailValue,
    "Reset your password",
    `<p>Reset link:</p><a href="${resetUrlValue}">${resetUrlValue}</a>`
  );
}

async function sendInvoiceEmail(toEmailValue, invoiceNumberValue) {
  await sendMail(
    toEmailValue,
    "Payment receipt / Invoice",
    `<p>Your invoice <b>${invoiceNumberValue}</b> is generated.</p>`
  );
}

module.exports = { sendVerifyEmail, sendResetPasswordEmail, sendInvoiceEmail };
