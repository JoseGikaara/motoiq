/**
 * Affiliate invitation and onboarding: QR, URLs, email, SMS.
 */
import nodemailer from "nodemailer";

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port: port ? Number(port) : 587,
    secure: port === "465",
    auth: { user, pass },
  });
  return transporter;
}

function normalizePhone(phone) {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("254")) return digits;
  return "254" + digits;
}

/**
 * Generate a QR code URL for the referral link (public API, no auth).
 */
export function getQrCodeUrl(referralUrl) {
  if (!referralUrl) return null;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralUrl)}`;
}

/**
 * Build the base referral URL for an affiliate.
 */
export function buildReferralUrl(baseOrigin, referralCode, websiteSlug) {
  const origin = (baseOrigin || "").replace(/\/$/, "");
  if (websiteSlug) {
    return `${origin}/s/${websiteSlug}?ref=${encodeURIComponent(referralCode)}`;
  }
  return `${origin}/?ref=${encodeURIComponent(referralCode)}`;
}

/**
 * Send invite email using SMTP (same as notify.js).
 */
export async function sendInviteEmail(affiliate, dealer, referralUrl) {
  if (!affiliate.email) return { sent: false };
  const trans = getTransporter();
  if (!trans) return { sent: false };
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@motoriq.co.ke";
  const dealerName = dealer.dealershipName || "Your dealer";
  const subject = `You're invited to ${dealerName}'s affiliate program`;
  const html = `
    <h2>Welcome to the ${dealerName} Affiliate Program</h2>
    <p>Hi ${affiliate.name},</p>
    <p>You've been invited to become an affiliate partner.</p>
    <p><strong>Your referral code:</strong> ${affiliate.referralCode}</p>
    <p><strong>Your dashboard:</strong> <a href="${referralUrl}">${referralUrl}</a></p>
    <p>Share your unique link to start earning commission on leads and sales.</p>
    <p>Questions? Contact your dealer.</p>
  `;
  try {
    await trans.sendMail({ from, to: affiliate.email, subject, html });
    return { sent: true };
  } catch (err) {
    console.error("Affiliate invite email error:", err);
    return { sent: false };
  }
}

/**
 * Send invite SMS using AfricasTalking (same env as notify.js).
 */
export async function sendInviteSms(affiliate, dealer, referralUrl) {
  if (!affiliate.phone) return { sent: false };
  if (!process.env.AFRICASTALKING_KEY) return { sent: false };
  try {
    const AfricasTalking = (await import("africastalking")).default;
    const sms = AfricasTalking({ apiKey: process.env.AFRICASTALKING_KEY });
    const dealerName = dealer.dealershipName || "Dealer";
    const msg = `Hi ${affiliate.name}! You're invited to ${dealerName}'s affiliate program. Your code: ${affiliate.referralCode}. Dashboard: ${referralUrl}`;
    const to = normalizePhone(affiliate.phone);
    await sms.SMS.send({ to: [to], message: msg });
    return { sent: true };
  } catch (err) {
    console.error("Affiliate invite SMS error:", err);
    return { sent: false };
  }
}
