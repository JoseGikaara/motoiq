import { Router } from "express";
import OpenAI from "openai";
import * as Sentry from "@sentry/node";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

export const aiRouter = Router();

const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
const openai = apiKey
  ? new OpenAI({
      apiKey,
      baseURL: process.env.DEEPSEEK_API_KEY ? "https://api.deepseek.com/v1" : undefined,
    })
  : null;

aiRouter.use(requireAuth);

async function chat(prompt, jsonMode = false) {
  if (!openai) throw new Error("AI_API_KEY_NOT_CONFIGURED");
  try {
    const res = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      response_format: jsonMode ? { type: "json_object" } : undefined,
    });
    const text = res.choices?.[0]?.message?.content?.trim() || "";
    if (jsonMode) return JSON.parse(text);
    return text;
  } catch (e) {
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(e);
    }
    throw e;
  }
}

// POST /api/ai/facebook-posts — generate Facebook Marketplace/Group listing descriptions for a car
aiRouter.post("/facebook-posts", async (req, res) => {
  try {
    const { carId } = req.body;
    if (!carId) return res.status(400).json({ error: "carId required" });

    const car = await prisma.car.findFirst({
      where: { id: carId, dealerId: req.dealer.id },
      include: { dealer: { select: { phone: true, city: true, dealershipName: true } } },
    });
    if (!car) return res.status(404).json({ error: "Car not found" });

    let specsObj = {};
    if (car.specs) try { specsObj = JSON.parse(car.specs); } catch {}
    const fuel = specsObj.fuel || specsObj.fuelType || "—";
    const transmission = specsObj.transmission || "—";
    const location = car.dealer?.city || specsObj.location || "Kenya";

    const baseUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "https://motoriq.co";
    const carPageUrl = `${baseUrl.replace(/\/$/, "")}/car/${car.id}`;
    let dealerPhone = (car.dealer?.phone || "").replace(/\D/g, "");
    if (dealerPhone.startsWith("0")) dealerPhone = "254" + dealerPhone.slice(1);
    if (dealerPhone && !dealerPhone.startsWith("254")) dealerPhone = "254" + dealerPhone;
    const whatsappUrl = dealerPhone ? `https://wa.me/${dealerPhone}` : "";

    const title = `${car.year} ${car.make} ${car.model}`;
    const priceStr = `KES ${(car.price || 0).toLocaleString()}`;
    const mileageStr = car.mileage != null ? `${car.mileage.toLocaleString()} km` : "—";

    function buildTemplates() {
      const lines = [
        title,
        `${priceStr} • ${mileageStr} • ${fuel} • ${transmission}`,
        `📍 ${location}`,
        car.description ? `\n${car.description}\n` : "",
        `🔗 View full details: ${carPageUrl}`,
        whatsappUrl ? `📱 WhatsApp: ${whatsappUrl}` : "",
      ].filter(Boolean);
      const fullText = lines.join("\n");

      return [
        {
          type: "marketplace",
          text: `${title}\n\n${priceStr}\n${mileageStr} | ${fuel} | ${transmission}\nLocation: ${location}\n\n${
            car.description || "Well maintained. Serious buyers only."
          }\n\nView details & photos: ${carPageUrl}\nContact via WhatsApp: ${whatsappUrl || "See listing"}`,
        },
        {
          type: "marketplace",
          text: `🚗 ${title}\n\n💰 ${priceStr}\n📏 ${mileageStr} • ⛽ ${fuel} • 🔧 ${transmission}\n📍 ${location}\n\n${
            car.description || "Clean title. Inspect in person welcome."
          }\n\n👉 ${carPageUrl}\n📱 WhatsApp: ${whatsappUrl || "In listing"}`,
        },
        { type: "group", text: fullText },
        {
          type: "group",
          text: `Selling: ${title}\n${priceStr} | ${mileageStr} | ${location}\nLink: ${carPageUrl}\nWhatsApp: ${
            whatsappUrl || "PM"
          }`,
        },
        {
          type: "short",
          text: `${title} – ${priceStr}\n${carPageUrl}\n${whatsappUrl ? `WhatsApp: ${whatsappUrl}` : ""}`,
        },
      ];
    }

    let posts;
    if (openai) {
      try {
        const prompt = `You are a car listing copywriter for Facebook in Kenya. Generate exactly 5 Facebook listing variations for this car. Return ONLY a valid JSON object (no markdown) with a key "posts" that is an array of 5 objects, each with "type" (one of "marketplace", "group", "short") and "text" (the full post text).

Car: ${car.year} ${car.make} ${car.model}
Price: ${priceStr}
Mileage: ${mileageStr} | Fuel: ${fuel} | Transmission: ${transmission}
Location: ${location}
${car.description ? `Description: ${car.description}` : ""}

Requirements for each post:
- Include a clear title (year make model), price, key specs, location.
- Include this exact link: ${carPageUrl}
- Include WhatsApp link: ${whatsappUrl || "Contact dealer for WhatsApp"}
- "marketplace" posts: 2 of them, polished for Facebook Marketplace.
- "group" posts: 2 of them, concise for car sale groups.
- "short" post: 1 of them, very brief (title, price, link, WhatsApp).
Write in English, Kenyan context. No hashtag spam.`;
        const result = await chat(prompt, true);
        const arr = result.posts;
        if (Array.isArray(arr) && arr.length >= 5) {
          posts = arr.slice(0, 5).map((p) => ({
            type: ["marketplace", "group", "short"].includes(p.type) ? p.type : "marketplace",
            text: String(p.text || "").trim() || buildTemplates()[0].text,
          }));
        } else {
          posts = buildTemplates();
        }
      } catch (e) {
        posts = buildTemplates();
      }
    } else {
      posts = buildTemplates();
    }

    await prisma.facebookPostGeneration.create({
      data: { dealerId: req.dealer.id, carId: car.id },
    });

    res.json({ posts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Facebook posts generation failed", detail: e.message });
  }
});

// POST /api/ai/score-lead
aiRouter.post("/score-lead", async (req, res) => {
  try {
    const { budget, financing, timeframe, tradeIn } = req.body;
    const prompt = `You are a sales lead scoring system for a car dealership in Kenya. Given the following lead data, return ONLY a valid JSON object (no markdown) with: score (one of "hot", "warm", "cold"), reason (short string), urgency (number 1-10).

Lead data:
- Budget: ${budget || "not specified"}
- Financing: ${financing || "not specified"}
- Timeframe: ${timeframe || "not specified"}
- Trade-in: ${tradeIn || "not specified"}

Consider: hot = ready to buy soon, has budget/financing; warm = interested, some details; cold = vague or long timeframe. Kenyan market context.`;
    const result = await chat(prompt, true);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI scoring failed", detail: e.message });
  }
});

// POST /api/ai/followup/:leadId
aiRouter.post("/followup/:leadId", async (req, res) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.leadId, dealerId: req.dealer.id },
      include: { car: true },
    });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const prompt = `You are a friendly car sales follow-up copywriter for a dealership in Kenya. Generate 3 follow-up SMS/message templates for this lead. Car: ${lead.car.make} ${lead.car.model} ${lead.car.year}, price KES ${lead.car.price}. Lead: ${lead.name}, budget ${lead.budget || "N/A"}, financing ${lead.financing || "N/A"}, timeframe ${lead.timeframe || "N/A"}.

Return ONLY a valid JSON object (no markdown) with exactly:
{
  "day1": "Message for Day 1 - warm intro + car highlight, short and personal",
  "day3": "Message for Day 3 - value reminder + scarcity (e.g. interest from others), Kenyan context",
  "day7": "Message for Day 7 - final nudge + offer (e.g. test drive or small incentive)"
}

Keep each message under 160 chars where possible, conversational, in English.`;
    const result = await chat(prompt, true);

    const upsert = async (day, message) => {
      await prisma.followUp.upsert({
        where: { leadId_day: { leadId: lead.id, day } },
        create: { leadId: lead.id, day, message },
        update: { message },
      });
    };
    if (result.day1) await upsert(1, result.day1);
    if (result.day3) await upsert(3, result.day3);
    if (result.day7) await upsert(7, result.day7);

    const followUps = await prisma.followUp.findMany({
      where: { leadId: lead.id },
      orderBy: { day: "asc" },
    });
    res.json({ followUps });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI follow-up failed", detail: e.message });
  }
});

// POST /api/ai/lead-advice — lead score, recommended next action, suggested WhatsApp response
aiRouter.post("/lead-advice", async (req, res) => {
  try {
    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ error: "leadId required" });

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, dealerId: req.dealer.id },
      include: {
        car: true,
        communications: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const carLabel = lead.car ? `${lead.car.make} ${lead.car.model} ${lead.car.year}`.trim() : "the car";
    const priceLabel = lead.car?.price != null ? `KES ${Number(lead.car.price).toLocaleString()}` : "";
    const lastContact = lead.communications?.[0];
    const lastContactAt = lastContact ? new Date(lastContact.createdAt).toISOString().slice(0, 10) : "never";

    const prompt = `You are a car sales advisor for a Kenyan dealership. For this lead, return ONLY a valid JSON object (no markdown) with:
- leadScore: "hot" | "warm" | "cold" (based on budget, timeframe, financing, status)
- nextAction: one short recommended next step (e.g. "Send WhatsApp within 1 hour", "Offer test drive", "Send financing options")
- suggestedResponse: a short WhatsApp message (1-2 sentences) the dealer could send to this lead now. Friendly, professional, Kenyan context.

Lead: ${lead.name}. Status: ${lead.status}. Score: ${lead.score || "unknown"}. Budget: ${lead.budget || "not set"}. Timeframe: ${lead.timeframe || "not set"}. Financing: ${lead.financing || "not set"}.
Car: ${carLabel}. ${priceLabel}.
Last contact: ${lastContactAt}.

Return JSON: { "leadScore": "hot"|"warm"|"cold", "nextAction": "string", "suggestedResponse": "string" }`;
    const result = await chat(prompt, true);

    res.json({
      leadScore: result.leadScore || lead.score || "warm",
      nextAction: result.nextAction || "Follow up when convenient",
      suggestedResponse: result.suggestedResponse || `Hi ${lead.name}, thanks for your interest in the ${carLabel}. How can we help?`,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Lead advice failed", detail: e.message });
  }
});

// POST /api/ai/next-actions/:leadId — suggested next actions (rule-based + optional AI prediction)
aiRouter.post("/next-actions/:leadId", async (req, res) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.leadId, dealerId: req.dealer.id },
      include: {
        car: true,
        communications: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const suggestedActions = [];
    const now = new Date();
    const lastComm = lead.communications?.[0];
    const lastContactAt = lastComm ? new Date(lastComm.createdAt) : null;
    const hoursSinceContact = lastContactAt
      ? (now.getTime() - lastContactAt.getTime()) / (1000 * 60 * 60)
      : 999;

    const carLabel = lead.car ? `${lead.car.make} ${lead.car.model} ${lead.car.year}`.trim() : "your car";
    const priceLabel = lead.car?.price != null ? `KES ${Number(lead.car.price).toLocaleString()}` : "";

    if (
      (lead.score === "hot" || (lead.urgency != null && lead.urgency >= 7)) &&
      lead.status !== "CLOSED" &&
      lead.status !== "LOST" &&
      hoursSinceContact >= 24
    ) {
      suggestedActions.push({
        type: "SMS",
        label: "Send SMS reminder",
        message: `Hi ${lead.name}, just checking in on the ${carLabel}${priceLabel ? ` (${priceLabel})` : ""}. Still interested? We're here when you're ready.`,
      });
    }

    let closeProbability = null;
    if (openai && (lead.score === "hot" || lead.status === "TEST_DRIVE" || lead.status === "NEGOTIATION")) {
      try {
        const prompt = `You are a car sales analyst for a Kenyan dealership. Given this lead, estimate close probability (0-100) and one short recommendation.

Lead: ${lead.name}. Status: ${lead.status}. Score: ${lead.score || "unknown"}. Urgency: ${lead.urgency ?? "n/a"}/10.
Car: ${carLabel}. ${priceLabel}.
Last contact: ${lastContactAt ? lastContactAt.toISOString().slice(0, 10) : "none"}.

Return ONLY valid JSON: { "closeProbability": number 0-100, "recommendation": "one short sentence" }`;
        const result = await chat(prompt, true);
        closeProbability = result.closeProbability != null ? Math.min(100, Math.max(0, Number(result.closeProbability))) : null;
        if (result.recommendation && suggestedActions.length < 2) {
          suggestedActions.push({
            type: "NOTE",
            label: "AI tip",
            message: result.recommendation,
          });
        }
      } catch {
        // non-fatal
      }
    }

    res.json({ suggestedActions, closeProbability });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Next actions failed", detail: e.message });
  }
});

// POST /api/ai/car-description — generate listing description from specs; deducts credits
aiRouter.post("/car-description", async (req, res) => {
  try {
    const { carId, make, model, year, price, mileage, color, specs } = req.body;
    let car = null;
    if (carId) {
      car = await prisma.car.findFirst({
        where: { id: carId, dealerId: req.dealer.id },
      });
      if (!car) return res.status(404).json({ error: "Car not found" });
    }
    const make_ = car?.make ?? make;
    const model_ = car?.model ?? model;
    const year_ = car?.year ?? year;
    const price_ = car?.price ?? price;
    const mileage_ = car?.mileage ?? mileage;
    const color_ = car?.color ?? color;
    let specsObj = {};
    if (car?.specs) try { specsObj = JSON.parse(car.specs); } catch {}
    if (specs && typeof specs === "string") try { specsObj = { ...specsObj, notes: specs }; } catch {}
    if (specs && typeof specs === "object") specsObj = { ...specsObj, ...specs };

    const settings = await prisma.systemSettings.findUnique({
      where: { id: "singleton" },
      select: { creditCostCarDescription: true },
    }).catch(() => null);
    const cost = settings?.creditCostCarDescription ?? 2;

    const dealer = await prisma.dealer.findUnique({
      where: { id: req.dealer.id },
      select: { credits: true },
    });
    const current = Number(dealer?.credits ?? 0);
    if (current < cost) {
      return res.status(402).json({ error: "Insufficient credits", creditsRequired: cost, creditsAvailable: current });
    }

    const prompt = `You are a premium car listing copywriter for a dealership in Kenya. Write a compelling, well-structured description for this vehicle that will appear on the dealer's website. Tone: professional, aspirational, and trustworthy. Mention key selling points, suitability for Kenyan roads/use, and any standout features. Write in clear paragraphs; use 3–5 short paragraphs. Do NOT use markdown or bullet lists — plain text only, line breaks between paragraphs.

Vehicle: ${year_} ${make_} ${model_}
Price: KES ${Number(price_).toLocaleString()}
Mileage: ${mileage_ != null ? `${Number(mileage_).toLocaleString()} km` : "N/A"}
Color: ${color_ || "N/A"}
Extra specs: ${JSON.stringify(specsObj)}

Return ONLY the description text, no title or labels.`;
    const description = await chat(prompt, false);
    const trimmed = (description || "").trim();
    if (!trimmed) return res.status(500).json({ error: "AI did not return a description" });

    await prisma.dealer.update({
      where: { id: req.dealer.id },
      data: {
        credits: Math.max(0, current - cost),
        totalCreditsUsed: { increment: cost },
      },
    });
    const { logActivity, getClientIp } = await import("../utils/activityLog.js");
    logActivity({
      dealerId: req.dealer.id,
      action: "AI_CAR_DESCRIPTION",
      detail: `${make_} ${model_} ${year_}`,
      ip: getClientIp(req),
      creditsUsed: cost,
      creditsAfter: Math.max(0, current - cost),
    }).catch(() => {});

    if (car && carId) {
      await prisma.car.update({
        where: { id: car.id },
        data: { description: trimmed },
      });
    }
    res.json({ description: trimmed, creditsUsed: cost });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Car description failed", detail: e.message });
  }
});

// POST /api/ai/facebook-replies — AI-generated Facebook comment reply templates (uses credits); fallback to templates
aiRouter.post("/facebook-replies", async (req, res) => {
  try {
    const { carId } = req.body;
    if (!carId) return res.status(400).json({ error: "carId required" });

    const car = await prisma.car.findFirst({
      where: { id: carId, dealerId: req.dealer.id },
      include: { dealer: { select: { phone: true } } },
    });
    if (!car) return res.status(404).json({ error: "Car not found" });

    const baseUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "https://motoriq.co";
    const carLink = `${baseUrl.replace(/\/$/, "")}/car/${car.id}?source=facebook_comment`;
    let dealerPhone = (car.dealer?.phone || "").replace(/\D/g, "");
    if (dealerPhone.startsWith("0")) dealerPhone = "254" + dealerPhone.slice(1);
    if (dealerPhone && !dealerPhone.startsWith("254")) dealerPhone = "254" + dealerPhone;
    const whatsappLink = dealerPhone ? `https://wa.me/${dealerPhone}` : "See listing";
    const title = `${car.year} ${car.make} ${car.model}`;
    const priceStr = `KES ${(car.price || 0).toLocaleString()}`;

    const templateReplies = [
      { text: `Hi! The car is still available.\n\nView photos and details:\n${carLink}\n\nWhatsApp me directly:\n${whatsappLink}` },
      { text: `Yes, still available! ${title} – ${priceStr}.\n\nFull details & photos: ${carLink}\n\nWhatsApp: ${whatsappLink}` },
      { text: `Hi! Thanks for your interest. You can see all details and photos here: ${carLink}\n\nOr WhatsApp me: ${whatsappLink}` },
    ];

    const settings = await prisma.systemSettings.findUnique({
      where: { id: "singleton" },
      select: { creditCostFacebookReplies: true },
    }).catch(() => null);
    const cost = settings?.creditCostFacebookReplies ?? 1;

    const dealer = await prisma.dealer.findUnique({
      where: { id: req.dealer.id },
      select: { credits: true },
    });
    const current = Number(dealer?.credits ?? 0);

    if (openai && current >= cost) {
      try {
        const prompt = `You are a friendly car dealer in Kenya replying to Facebook comments. Generate exactly 3 short reply messages that a dealer can paste under a Facebook post/comment to invite buyers to view the car and contact via WhatsApp. Each reply must be friendly and must include these exact links (do not modify them):
- Car page: ${carLink}
- WhatsApp: ${whatsappLink}

Car: ${title}. Price: ${priceStr}.

Return ONLY a valid JSON object (no markdown) with key "replies" = array of 3 strings. Example: { "replies": ["message 1 with the links above", "message 2...", "message 3..."] }. Each message should be 2-4 sentences, include both links, and sound natural for Kenyan Facebook.`;
        const result = await chat(prompt, true);
        const arr = result.replies;
        if (Array.isArray(arr) && arr.length >= 3) {
          const replies = arr.slice(0, 3).map((t) => ({ text: String(t || "").trim() || templateReplies[0].text }));
          await prisma.dealer.update({
            where: { id: req.dealer.id },
            data: {
              credits: Math.max(0, current - cost),
              totalCreditsUsed: { increment: cost },
            },
          });
          const { logActivity, getClientIp } = await import("../utils/activityLog.js");
          logActivity({
            dealerId: req.dealer.id,
            action: "AI_FACEBOOK_REPLIES",
            detail: title,
            ip: getClientIp(req),
            creditsUsed: cost,
            creditsAfter: Math.max(0, current - cost),
          }).catch(() => {});
          return res.json({ replies, creditsUsed: cost });
        }
      } catch (e) {
        console.error("AI facebook-replies fallback:", e.message);
      }
    }

    res.json({ replies: templateReplies, creditsUsed: 0 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Facebook replies failed", detail: e.message });
  }
});

// POST /api/ai/ad-copy
aiRouter.post("/ad-copy", async (req, res) => {
  try {
    const { carId, targetAudience, location } = req.body;
    if (!carId) return res.status(400).json({ error: "carId required" });
    const car = await prisma.car.findFirst({
      where: { id: carId, dealerId: req.dealer.id },
    });
    if (!car) return res.status(404).json({ error: "Car not found" });

    const prompt = `You are an ad copywriter for car dealerships in Kenya. Generate social media ad copy for this vehicle.

Car: ${car.make} ${car.model} ${car.year}, KES ${car.price}, mileage ${car.mileage || "N/A"}, color ${car.color || "N/A"}
Target audience: ${targetAudience || "General car buyers in Kenya"}
Location: ${location || "Kenya"}

Return ONLY a valid JSON object (no markdown):
{
  "headlines": ["headline1", "headline2", "headline3"],
  "descriptions": ["description1", "description2", "description3"],
  "captions": ["caption1", "caption2", "caption3"]
}

- Headlines: short, punchy, under 60 chars.
- Descriptions: 1-2 sentences for listings.
- Captions: hook-based, Instagram/Facebook ready, conversational, can include emoji, Kenyan context.`;
    const result = await chat(prompt, true);

    const adCopy = await prisma.adCopy.create({
      data: {
        carId: car.id,
        dealerId: req.dealer.id,
        headlines: result.headlines || [],
        descriptions: result.descriptions || [],
        captions: result.captions || [],
        targetAudience: targetAudience || null,
        location: location || null,
      },
    });
    res.json(adCopy);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI ad copy failed", detail: e.message });
  }
});
