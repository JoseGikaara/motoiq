import prisma from "../lib/prisma.js";
import OpenAI from "openai";

const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
const openai = apiKey
  ? new OpenAI({
      apiKey,
      baseURL: process.env.DEEPSEEK_API_KEY ? "https://api.deepseek.com/v1" : undefined,
    })
  : null;

function normalizeKenyanPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("254")) return digits;
  return "254" + digits;
}

/** Resolve placeholders in template with lead/car context */
function resolveTemplate(text, lead, lastInteraction) {
  const car = lead.car || {};
  return text
    .replace(/\{leadName\}/g, lead.name || "")
    .replace(/\{carModel\}/g, `${car.make || ""} ${car.model || ""}`.trim() || "this car")
    .replace(/\{price\}/g, car.price != null ? `KES ${Number(car.price).toLocaleString()}` : "")
    .replace(/\{lastInteraction\}/g, lastInteraction || "none");
}

/** Optional AI personalization (uses 1 credit if useCredits exists) */
async function personalizeWithAI(templateText, lead) {
  if (!openai) return templateText;
  const car = lead.car || {};
  const prompt = `You are a car sales copywriter in Kenya. Personalize this follow-up message for a lead. Keep it short (under 160 chars for SMS), conversational, in English.

Template: ${templateText}

Lead: ${lead.name}. Car: ${car.make} ${car.model} ${car.year}. Score: ${lead.score || "unknown"}. Status: ${lead.status}.

Return ONLY the personalized message string, no JSON, no quotes.`;
  try {
    const res = await openai.chat.completions.create({
      model: process.env.DEEPSEEK_API_KEY ? "deepseek-chat" : "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    const out = res.choices?.[0]?.message?.content?.trim();
    return out || templateText;
  } catch {
    return templateText;
  }
}

/** Send SMS via Africa's Talking */
async function sendSms(phone, message) {
  const apiKey = process.env.AFRICASTALKING_API_KEY || process.env.AFRICASTALKING_KEY;
  const username = process.env.AFRICASTALKING_USERNAME;
  const to = normalizeKenyanPhone(phone);
  if (!apiKey || !to) return { ok: false, status: "SKIPPED_CONFIG" };
  try {
    const AfricasTalking = (await import("africastalking")).default;
    const at = AfricasTalking({ apiKey, username: username || "sandbox" });
    await at.SMS.send({ to: [to], message });
    return { ok: true, status: "SENT" };
  } catch (err) {
    console.error("Drip SMS error:", err);
    return { ok: false, status: "FAILED" };
  }
}

/** Send email via Nodemailer */
async function sendEmail(to, subject, text) {
  try {
    const nodemailer = await import("nodemailer");
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) return { ok: false, status: "SKIPPED_CONFIG" };
    const transporter = nodemailer.default.createTransport({
      host,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_PORT === "465",
      auth: { user, pass },
    });
    const from = process.env.SMTP_FROM || process.env.MAIL_FROM || user;
    await transporter.sendMail({ from, to, subject, text });
    return { ok: true, status: "SENT" };
  } catch (err) {
    console.error("Drip email error:", err);
    return { ok: false, status: "FAILED" };
  }
}

/** Run one due step: resolve message, send, log, advance enrollment */
async function processEnrollment(enrollment) {
  const { lead, sequence } = enrollment;
  const steps = sequence.steps || [];
  const stepIndex = enrollment.currentStep - 1;
  const step = steps[stepIndex];
  if (!step) {
    await prisma.leadDripEnrollment.update({
      where: { id: enrollment.id },
      data: { status: "COMPLETED" },
    });
    return;
  }

  // Stop if lead is closed/lost
  if (lead.status === "CLOSED" || lead.status === "LOST") {
    await prisma.leadDripEnrollment.update({
      where: { id: enrollment.id },
      data: { status: "STOPPED" },
    });
    return;
  }

  const now = new Date();
  const referenceDate = enrollment.lastSentAt || enrollment.startedAt;
  const daysSince = (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince < step.triggerAfterDays) return;

  // Last interaction for placeholder
  const lastComm = await prisma.communicationLog.findFirst({
    where: { leadId: lead.id },
    orderBy: { createdAt: "desc" },
  });
  const lastInteraction = lastComm
    ? `${lastComm.channel} ${new Date(lastComm.createdAt).toLocaleDateString()}`
    : "none";

  let message = resolveTemplate(step.templateText, lead, lastInteraction);
  if (step.useAI) message = await personalizeWithAI(message, lead);

  const channel = step.channel;
  let sendStatus = "SKIPPED";

  if (channel === "SMS") {
    const r = await sendSms(lead.phone, message);
    sendStatus = r.status;
  } else if (channel === "EMAIL") {
    const subject = `Follow up – ${lead.car?.make || ""} ${lead.car?.model || ""}`.trim() || "Follow up";
    const r = await sendEmail(lead.email, subject, message);
    sendStatus = r.status;
  } else {
    // WHATSAPP: we only log; dealer can send manually
    sendStatus = "LOGGED";
  }

  await prisma.communicationLog.create({
    data: {
      leadId: lead.id,
      dealerId: lead.dealerId,
      channel: channel === "WHATSAPP" ? "WHATSAPP" : channel,
      direction: "OUTBOUND",
      content: message,
      snippet: message.slice(0, 160),
      status: sendStatus,
      meta: JSON.stringify({ source: "drip", sequenceId: sequence.id, stepOrder: step.order }),
    },
  });

  const nextStep = enrollment.currentStep + 1;
  const isComplete = nextStep > steps.length;

  await prisma.leadDripEnrollment.update({
    where: { id: enrollment.id },
    data: {
      lastSentAt: now,
      currentStep: nextStep,
      status: isComplete ? "COMPLETED" : "ACTIVE",
    },
  });
}

/** Scan and process all due drip steps. Call from cron. */
export async function runDripNurture() {
  const enrollments = await prisma.leadDripEnrollment.findMany({
    where: { status: "ACTIVE" },
    include: {
      lead: { include: { car: true } },
      sequence: { include: { steps: { orderBy: { order: "asc" } } } },
    },
  });

  for (const enrollment of enrollments) {
    try {
      await processEnrollment(enrollment);
    } catch (e) {
      console.error("Drip process enrollment error:", enrollment.id, e);
    }
  }
}
