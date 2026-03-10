# MotorIQ — App Breakdown for Sales

**Tagline:** *Turn browsers into buyers.*  
**One-liner:** AI-powered sales engine for car dealers — capture every lead, score it automatically, and follow up with AI-written messages.

---

## 1. What MotorIQ Is

MotorIQ is a **done-for-you sales platform** for car dealerships. It’s not just software: you express interest, we set up the entire system (website, dashboard, pipeline, AI), and the dealer logs in to a ready-to-use sales engine.

- **Dealer dashboard** — Inventory, leads, pipeline, tasks, test drives, ads, automation, analytics, affiliates, settings.
- **Public dealer website** — Branded showroom at `/s/{slug}` or custom domain: home, inventory, car detail, about, financing, favorites.
- **Admin console** — You manage dealers, subscriptions, interested leads, activity, system health.
- **Demo** — Live demo at `/demo` (auto-login) and public demo showroom for prospects.

**Built for:** Kenyan car dealers who want more leads, better follow-up, and a professional online presence without hiring a dev team.

---

## 2. Target Audience

| Who | Pain points MotorIQ solves |
|-----|----------------------------|
| **Small / mid dealerships** | No proper website, leads lost in WhatsApp, no pipeline or follow-up system |
| **Dealers with a basic site** | Static site, no lead capture, no CRM, no AI |
| **Dealers wanting to scale** | Need inventory management, lead scoring, and automation in one place |
| **Dealers in Kenya** | Local focus: KES, WhatsApp, local hosting/domain offer |

---

## 3. Core Features (What You’re Selling)

### Dealer dashboard (after login)

| Area | What it does |
|------|----------------------|
| **Overview** | Dashboard with key metrics and quick actions |
| **Cars** | Full inventory CRUD, bulk CSV/Excel upload, photos, status |
| **Leads** | All inquiries in one place, linked to cars |
| **Pipeline** | Kanban board: move leads through stages (e.g. New → Contacted → Test drive → Closed) |
| **Tasks** | Follow-up tasks, linked to leads; badge count in nav |
| **Test drives** | Schedule and track test drives |
| **Ad copy** | AI-generated ad copy (e.g. Facebook) for cars |
| **Automation** | Drip sequences and automations for leads |
| **Analytics** | Sales analytics, lead sources, pipeline stats |
| **Affiliates** | Affiliate program: referral links, commissions, materials, challenges |
| **Settings** | Profile, website (slug, domain, theme, hero, about, financing), notifications |

### Public dealer website

- **Home** — Hero, featured cars, marquee/carousel, banners.
- **Inventory** — List/filter/sort cars, grid/list view, quick view.
- **Car detail** — Gallery, specs, finance calculator, lead form, test-drive form, share, favorites.
- **About** — Dealer info, contact, map link.
- **Financing** — Calculator and financing options.
- **Favorites** — Saved cars (per browser).
- **SEO** — Meta tags, structured data for dealer and cars.
- **Theme** — Configurable look; works on mobile.

### AI (differentiator)

- **Lead scoring** — AI scores leads (e.g. hot/warm/cold).
- **Follow-up messages** — AI-suggested or generated follow-up text.
- **Ad copy** — AI-generated social/ad copy for each car.
- **Credits** — Usage tracked per dealer; admin can set credits.

### Admin (you)

- **Interest inbox** — Leads from “I’m Interested” on landing page (NEW, CONTACTED, CONVERTED).
- **Dealers** — List, create dealer (with auto password, email, slug, plan, credits), suspend/activate, delete.
- **Subscriptions** — Plans and status.
- **Activity log** — Audit trail.
- **System health** — Monitoring.

---

## 4. How It Works (Sales Process)

1. **Prospect visits** your landing page (e.g. `yourapp.com`).
2. **Clicks “I’m Interested”** → form: name, dealership name, email, phone, city, estimated inventory.
3. **You get the lead** in Admin → **Interest inbox**.
4. **You qualify** → Mark CONTACTED, then create dealer in **Dealers** (name, email, slug, plan, credits, domain, etc.).
5. **System** creates account, generates password, sets up website/dashboard, sends “Your MotorIQ dealer dashboard is ready” email with login URL and temp password.
6. **Dealer logs in** at `/login` (no self-registration).
7. **Dealer uses** dashboard + live public site; you can freeze/activate or delete from admin.

**No self-signup.** You control who gets an account — premium, done-for-you positioning.

---

## 5. Offer (Value Bundle)

When you pitch, you can say onboarding includes:

- **Free domain** for 1 year  
- **Free hosting** for 1 year  
- **Preconfigured dealer dashboard**  
- **Website setup and branding** (slug, optional custom domain)  
- **AI credits** for lead scoring, follow-ups, and ad copy  

Position as: *“We set up the entire sales engine — you just log in and start closing deals.”*

---

## 6. Competitive Angles

- **Done-for-you** — No DIY setup; you onboard them.
- **All-in-one** — Website + CRM + pipeline + AI + affiliates in one platform.
- **AI-first** — Scoring, follow-ups, ad copy out of the box.
- **Kenya-focused** — Built for Kenyan dealers (e.g. KES, WhatsApp, local messaging).
- **Controlled growth** — Limited onboarding slots → “we only onboard a limited number of dealers to keep support personal.”

---

## 7. Demo & Proof

- **Live demo (dealer view):** `yourapp.com/demo` — auto-logs into a demo dealer account with sample cars, leads, analytics, AI.
- **Public showroom:** `yourapp.com/s/demo-showroom` (or your actual demo slug) — what a dealer’s live site looks like.
- **Landing page:** `yourapp.com` — hero, features, how it works, offer, “I’m Interested” CTA.

Use these in sales: *“Let me show you the dashboard and your future showroom in 5 minutes.”*

---

## 8. Pricing (You Define)

- Pricing is **not** in the app; you set it (e.g. one-time onboarding + monthly, or monthly only).
- You can say: *“We’ll reach out with a tailored walkthrough and **pricing for your exact situation**.”*
- Admin can assign **plans** and **credits** per dealer when creating accounts.

---

## 9. Objection Handlers (Short)

| Objection | Response |
|-----------|----------|
| “We only use WhatsApp.” | “MotorIQ captures leads from your website and WhatsApp. You get one place for all leads, plus AI follow-up so nothing falls through the cracks.” |
| “We already have a website.” | “We add a full sales engine behind it: lead capture, pipeline, scoring, and AI follow-up. We can also host a new branded site for you with the same tools.” |
| “Too expensive.” | “We include domain and hosting for a year, setup, and AI credits. You’re getting a complete sales engine, not just a template.” |
| “We’re not tech people.” | “That’s why we do everything for you. You get login details and a ready dashboard; we handle the rest.” |

---

## 10. Quick Feature Checklist (For Proposals)

- [ ] Car inventory management (with bulk upload)
- [ ] Public car showroom website (branded, mobile-friendly)
- [ ] Lead capture forms (per car + general)
- [ ] Kanban sales pipeline
- [ ] AI lead scoring
- [ ] AI follow-up messages
- [ ] AI ad copy generation
- [ ] Sales analytics dashboard
- [ ] Test drive scheduling
- [ ] Affiliate program (referral links, commissions)
- [ ] Drip/automation sequences
- [ ] Done-for-you onboarding (domain, hosting, setup, AI credits)
- [ ] Admin control (create/suspend/delete dealers, interest inbox)

---

## 11. Next Steps for You

1. **Deploy** — Get the app live (e.g. Vercel + Railway + Supabase) so prospects can use the landing page and demo.
2. **Set pricing** — Decide onboarding fee + monthly (or your model) and document it for your team.
3. **Use the interest form** — All “I’m Interested” submissions go to Admin → Interest inbox; follow up from there.
4. **Create first dealers** — Use Admin → Dealers → “Create dealer” to onboard and test the full flow.
5. **Share** — Landing page URL + “Try the demo” (`/demo`) for prospects.

---

*MotorIQ — Turn browsers into buyers. Built for Kenyan car dealers.*
