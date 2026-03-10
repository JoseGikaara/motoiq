import nodemailer from "nodemailer";
import { applicationReceivedHtml } from "../emails/application-received.js";
import { paymentInstructionsHtml } from "../emails/payment-instructions.js";
import { paymentReceivedHtml } from "../emails/payment-received.js";
import { accountApprovedHtml } from "../emails/account-approved.js";
import { applicationRejectedHtml } from "../emails/application-rejected.js";

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_PORT === "465",
    auth: { user, pass },
  });
  return transporter;
}

const from = () => process.env.SMTP_FROM || process.env.MAIL_FROM || process.env.SMTP_USER || "noreply@motoriq.co.ke";
const baseUrl = () => process.env.DASHBOARD_URL || process.env.FRONTEND_URL || "http://localhost:5173";

export async function sendApplicationReceived(to, fullName) {
  const trans = getTransporter();
  if (!trans) return;
  const statusUrl = `${baseUrl()}/apply/status?email=${encodeURIComponent(to)}`;
  await trans.sendMail({
    from: from(),
    to,
    subject: "MotorIQ — Application Received",
    html: applicationReceivedHtml({ fullName, email: to, statusUrl }),
  });
}

export async function sendPaymentInstructions(to, fullName, amount, applicationId) {
  const trans = getTransporter();
  if (!trans) return;
  const statusUrl = `${baseUrl()}/apply/status?email=${encodeURIComponent(to)}`;
  await trans.sendMail({
    from: from(),
    to,
    subject: "MotorIQ — Your Payment Instructions",
    html: paymentInstructionsHtml({ fullName, amount, applicationId, statusUrl }),
  });
}

export async function sendPaymentReceived(to, fullName) {
  const trans = getTransporter();
  if (!trans) return;
  await trans.sendMail({
    from: from(),
    to,
    subject: "MotorIQ — Payment Received, Verifying Now",
    html: paymentReceivedHtml({ fullName }),
  });
}

export async function sendAccountApproved(to, fullName, tempPassword) {
  const trans = getTransporter();
  if (!trans) return;
  const loginUrl = `${baseUrl()}/login`;
  await trans.sendMail({
    from: from(),
    to,
    subject: "MotorIQ — Your Account is Live!",
    html: accountApprovedHtml({ fullName, email: to, tempPassword, loginUrl }),
  });
}

export async function sendApplicationRejected(to, fullName, reason) {
  const trans = getTransporter();
  if (!trans) return;
  await trans.sendMail({
    from: from(),
    to,
    subject: "MotorIQ — Application Update",
    html: applicationRejectedHtml({ fullName, reason }),
  });
}

export async function sendAdminNewApplication(adminEmail, applicantName, dealershipName) {
  const trans = getTransporter();
  if (!trans || !adminEmail) return;
  await trans.sendMail({
    from: from(),
    to: adminEmail,
    subject: `MotorIQ — New application from ${applicantName} — ${dealershipName}`,
    html: `<p>New onboarding application received.</p><p><strong>Name:</strong> ${applicantName}</p><p><strong>Dealership:</strong> ${dealershipName}</p><p>Log in to the admin panel to review.</p>`,
  });
}

export async function sendAdminPaymentSubmitted(adminEmail, applicantName, paymentRef) {
  const trans = getTransporter();
  if (!trans || !adminEmail) return;
  await trans.sendMail({
    from: from(),
    to: adminEmail,
    subject: `MotorIQ — Payment submitted by ${applicantName} — ref: ${paymentRef}`,
    html: `<p>Payment proof submitted.</p><p><strong>Applicant:</strong> ${applicantName}</p><p><strong>Reference:</strong> ${paymentRef}</p><p>Log in to the admin panel to confirm.</p>`,
  });
}
