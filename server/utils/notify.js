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

export async function notifyDealer(dealer, lead, car) {
  const trans = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@motoriq.co.ke";
  const dashboardUrl = process.env.DASHBOARD_URL || "https://app.motoriq.co.ke";
  const subject = `🔥 New Lead for your ${car.year} ${car.make} ${car.model}`;
  const html = `
    <h2>New lead</h2>
    <p><strong>Name:</strong> ${lead.name}</p>
    <p><strong>Phone:</strong> ${lead.phone}</p>
    <p><strong>Email:</strong> ${lead.email}</p>
    <p><strong>Budget:</strong> ${lead.budget || "—"}</p>
    <p><strong>Financing:</strong> ${lead.financing || "—"}</p>
    <p><strong>When ready to buy:</strong> ${lead.timeframe || "—"}</p>
    <p><a href="${dashboardUrl}/leads">View in dashboard →</a></p>
  `;
  if (trans && dealer.email) {
    try {
      await trans.sendMail({
        from,
        to: dealer.email,
        subject,
        html,
      });
    } catch (err) {
      console.error("Notify email error:", err);
    }
  }

  if (process.env.AFRICASTALKING_KEY && dealer.phone) {
    try {
      const AfricasTalking = (await import("africastalking")).default;
      const sms = AfricasTalking({ apiKey: process.env.AFRICASTALKING_KEY });
      const msg = `MotorIQ: New lead from ${lead.name} for your ${car.make} ${car.model}. Budget: ${lead.budget || "N/A"}. Login to follow up.`;
      const phone = String(dealer.phone).replace(/\D/g, "");
      const to = phone.startsWith("0") ? "254" + phone.slice(1) : phone.startsWith("254") ? phone : "254" + phone;
      await sms.SMS.send({ to: [to], message: msg });
    } catch (err) {
      console.error("Notify SMS error:", err);
    }
  }
}

/** Notify dealer that their hosted website is approaching expiry (about 30 days left). */
export async function notifyWebsiteExpiry(dealer) {
  const trans = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@motoriq.co.ke";
  const appUrl = process.env.DASHBOARD_URL || "https://app.motoriq.co.ke";
  const expires = dealer.websiteExpiresAt ? new Date(dealer.websiteExpiresAt) : null;
  const prettyDate = expires ? expires.toLocaleDateString("en-KE") : "soon";
  const siteUrl = dealer.websiteSlug ? `https://${dealer.websiteSlug}.motoriq.co.ke` : "your MotorIQ website";
  const subject = `Reminder: Your MotorIQ website expires on ${prettyDate}`;
  const html = `
    <h2>Your hosted website is almost due</h2>
    <p>Hi ${dealer.dealershipName || ""},</p>
    <p>Your MotorIQ-hosted website (${siteUrl}) is set to expire around <strong>${prettyDate}</strong>.</p>
    <p>To keep your public site online, please log into your dashboard and renew your hosting.</p>
    <p><a href="${appUrl}/settings">Open dashboard →</a></p>
  `;
  if (trans && dealer.email) {
    try {
      await trans.sendMail({
        from,
        to: dealer.email,
        subject,
        html,
      });
    } catch (err) {
      console.error("Website expiry email error:", err);
    }
  }

  if (process.env.AFRICASTALKING_KEY && dealer.phone) {
    try {
      const AfricasTalking = (await import("africastalking")).default;
      const sms = AfricasTalking({ apiKey: process.env.AFRICASTALKING_KEY });
      const phone = String(dealer.phone).replace(/\D/g, "");
      const to = phone.startsWith("0") ? "254" + phone.slice(1) : phone.startsWith("254") ? phone : "254" + phone;
      const msg = `MotorIQ: Your dealership website will expire around ${prettyDate}. Login to your MotorIQ dashboard to renew.`;
      await sms.SMS.send({ to: [to], message: msg });
    } catch (err) {
      console.error("Website expiry SMS error:", err);
    }
  }
}
