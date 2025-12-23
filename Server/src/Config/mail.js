const nodemailer = require("nodemailer");
const { cfg } = require("./config");

function createMailerTransport() {
  return nodemailer.createTransport({
    host: cfg.MAIL_HOST,
    port: cfg.MAIL_PORT,
    secure: cfg.MAIL_PORT === 465,
    auth: { user: cfg.MAIL_USER, pass: cfg.MAIL_PASS }
  });
}

module.exports = { createMailerTransport };
