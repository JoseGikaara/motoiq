import "dotenv/config";
// For seeding, prefer DIRECT_URL (non-pooler) to avoid prepared statement issues on Supabase.
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}
import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma.js";

const DEMO_EMAIL = "demo@motoriq.co.ke";
const DEMO_PASSWORD = "demo123";

async function seedDemoDealer() {
  try {
    console.log("Seeding demo dealer...");

    let dealer = await prisma.dealer.findUnique({ where: { email: DEMO_EMAIL } });

    if (!dealer) {
      const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
      dealer = await prisma.dealer.create({
        data: {
          name: "Demo Dealer",
          email: DEMO_EMAIL,
          password: hashed,
          phone: "0712 345 678",
          dealershipName: "MotorIQ Demo Showroom",
          city: "Nairobi",
          tagline: "Premium pre-owned cars for Kenyan roads",
          logoUrl: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&auto=format&fit=crop",
          primaryColor: "#2563EB",
          websiteSlug: "demo-showroom",
          websiteActive: true,
          websiteExpiresAt: (() => {
            const d = new Date();
            d.setFullYear(d.getFullYear() + 1);
            return d;
          })(),
          onboardingComplete: true,
        },
      });
      console.log("Created demo dealer:", dealer.email);
    } else {
      // Ensure website + onboarding flags for existing demo dealer
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      dealer = await prisma.dealer.update({
        where: { id: dealer.id },
        data: {
          websiteSlug: dealer.websiteSlug || "demo-showroom",
          websiteActive: true,
          websiteExpiresAt: dealer.websiteExpiresAt || d,
          onboardingComplete: true,
        },
      });
      console.log("Updated existing demo dealer website settings.");
    }

    // Clear any existing demo cars/leads to keep dataset fresh
    await prisma.testDrive.deleteMany({ where: { dealerId: dealer.id } });
    await prisma.adCopy.deleteMany({ where: { dealerId: dealer.id } });
    await prisma.lead.deleteMany({ where: { dealerId: dealer.id } });
    await prisma.car.deleteMany({ where: { dealerId: dealer.id } });

    console.log("Existing demo inventory cleared.");

    // Seed rich inventory with realistic assets (photos + 360/3D placeholders in specs JSON)
    const baseSpecs = (extra = {}) =>
      JSON.stringify({
        transmission: "Automatic",
        drivetrain: "4WD / AWD",
        fuel: "Petrol",
        seats: 5,
        ...extra,
        virtualTour: {
          has360Exterior: true,
          has360Interior: true,
          hasGltfModel: true,
          exteriorImagesBase: "https://demo-assets.motoriq.co.ke/360/exterior",
          interiorPano: "https://demo-assets.motoriq.co.ke/pano/interior.jpg",
          gltfUrl: "https://demo-assets.motoriq.co.ke/models/demo-car.glb",
        },
      });

    const carsData = [
      {
        make: "Toyota",
        model: "Land Cruiser Prado TX-L",
        year: 2021,
        price: 7800000,
        mileage: 24000,
        color: "Pearl White",
        photos: [
          "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1549920194-4a2153c29a9a?w=1200&auto=format&fit=crop",
        ],
        specs: baseSpecs({ engine: "2.8L Turbo Diesel", trim: "TX-L", highlight: "Perfect for Kenyan upcountry and city driving" }),
        description: "The Toyota Land Cruiser Prado TX-L represents the pinnacle of reliability and capability for Kenyan roads. With its 2.8L turbo diesel engine and full-time 4WD, it handles everything from Nairobi traffic to rugged upcountry terrain with confidence.\n\nThis 2021 example in Pearl White has covered just 24,000 km and comes with the full TX-L specification: leather trim, multi-terrain select, and a robust build that has made the Prado the choice of families and businesses across East Africa.\n\nIdeal for school runs, weekend getaways, and long-distance travel, this Prado is ready to serve for years to come.",
      },
      {
        make: "Mercedes-Benz",
        model: "C200 AMG Line",
        year: 2020,
        price: 6400000,
        mileage: 31000,
        color: "Obsidian Black",
        photos: [
          "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=1200&auto=format&fit=crop",
        ],
        specs: baseSpecs({ engine: "1.5L Turbo", trim: "AMG Line", highlight: "Premium German sedan with full AMG styling" }),
        description: "A Mercedes-Benz C200 AMG Line in Obsidian Black delivers executive presence and driving pleasure in one package. The 1.5L turbocharged engine offers strong performance with efficiency, while the AMG Line styling gives this sedan a sporty, confident stance.\n\nInside, you get the full Mercedes experience: premium materials, intuitive infotainment, and a cabin built for long journeys. With 31,000 km on the clock, this 2020 model is in excellent condition and ready to impress on both business and leisure drives.\n\nPerfect for the professional who demands quality and style without compromise.",
      },
      {
        make: "Mazda",
        model: "CX-5",
        year: 2019,
        price: 2850000,
        mileage: 58000,
        color: "Soul Red Crystal",
        photos: [
          "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop",
        ],
        specs: baseSpecs({ engine: "2.0L Petrol", highlight: "Best-seller SUV for Kenyan families" }),
        description: "The Mazda CX-5 in Soul Red Crystal is one of the most sought-after family SUVs on the Kenyan market. Its 2.0L petrol engine is smooth and reliable, while the Kodo design language gives it a premium look that stands out in any car park.\n\nThis 2019 example has been well maintained and is ready for school runs, weekend trips, and everything in between. Spacious, comfortable, and efficient, the CX-5 continues to be a smart choice for families who want style and practicality.",
      },
      {
        make: "Subaru",
        model: "Forester XT",
        year: 2018,
        price: 2650000,
        mileage: 72000,
        color: "Dark Grey",
        photos: [
          "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&auto=format&fit=crop",
        ],
        specs: baseSpecs({ engine: "2.0L Turbo", highlight: "Turbo performance with symmetrical AWD" }),
        description: "Subaru's Forester XT combines turbocharged performance with legendary symmetrical AWD. This 2018 Dark Grey example is built for drivers who want capability and punch on and off the tarmac.\n\nWith 72,000 km recorded, the 2.0L turbo engine and robust drivetrain are well run-in and ready for many more kilometres. Ideal for adventurous families and anyone who values traction and reliability in all conditions.",
      },
      {
        make: "Volkswagen",
        model: "Golf GTI",
        year: 2017,
        price: 2350000,
        mileage: 68000,
        color: "Tornado Red",
        photos: [
          "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=1200&auto=format&fit=crop",
        ],
        specs: baseSpecs({ engine: "2.0L Turbo", highlight: "Hot hatch with DSG gearbox" }),
        description: "The Volkswagen Golf GTI in Tornado Red is the definitive hot hatch. Its 2.0L turbo engine and DSG gearbox deliver sharp acceleration and precise shifts, while the practical five-door layout keeps everyday use stress-free.\n\nThis 2017 model with 68,000 km offers the perfect blend of fun and usability. Whether you're carving through traffic or heading out of town, the GTI delivers driving pleasure without compromise.",
      },
      {
        make: "BMW",
        model: "X3 xDrive20d",
        year: 2019,
        price: 5950000,
        mileage: 41000,
        color: "Mineral White",
        photos: [
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop",
        ],
        specs: baseSpecs({ engine: "2.0L Diesel", highlight: "Luxury compact SUV with xDrive" }),
        description: "The BMW X3 xDrive20d in Mineral White brings luxury and versatility together. The 2.0L diesel engine is both powerful and economical, while xDrive ensures sure-footed handling in all conditions.\n\nWith 41,000 km, this 2019 X3 is in excellent condition. Premium cabin materials, advanced technology, and that unmistakable BMW driving experience make it a compelling choice for the discerning buyer.",
      },
      {
        make: "Toyota",
        model: "Vitz",
        year: 2016,
        price: 950000,
        mileage: 89000,
        color: "Silver",
        photos: [
          "https://images.unsplash.com/photo-1541446654331-595c9e731287?w=1200&auto=format&fit=crop",
        ],
        specs: baseSpecs({ engine: "1.3L Petrol", highlight: "Perfect daily city run-around" }),
        description: "The Toyota Vitz is Kenya's favourite city car for good reason. Compact, fuel-efficient, and built to last, this 2016 Silver example with 89,000 km is the ideal run-around for daily commutes and errands.\n\nThe 1.3L petrol engine is proven and economical. Easy to park, cheap to run, and backed by Toyota's reputation for reliability, this Vitz is ready for its next owner.",
      },
      {
        make: "Nissan",
        model: "X-Trail",
        year: 2018,
        price: 2450000,
        mileage: 65000,
        color: "White Pearl",
        photos: [
          "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=1200&auto=format&fit=crop",
        ],
        specs: baseSpecs({ engine: "2.0L Petrol", highlight: "Spacious 7-seater SUV" }),
        description: "The Nissan X-Trail in White Pearl offers space and versatility for growing families. With flexible seating for up to seven and a practical 2.0L petrol engine, it handles school runs and weekend getaways with ease.\n\nThis 2018 model has 65,000 km and is in great condition. Spacious boot, comfortable cabin, and strong build quality make the X-Trail a dependable choice for Kenyan families.",
      },
      {
        make: "Toyota",
        model: "Land Cruiser V8",
        year: 2018,
        price: 8500000,
        mileage: 52000,
        color: "Black",
        photos: [
          "https://images.unsplash.com/photo-1541443131874-74fd88ab6f79?w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1519581059870-4ac2a7c7f3fd?w=1200&auto=format&fit=crop",
        ],
        specs: baseSpecs({
          engine: "4.5L V8 Turbo Diesel",
          highlight: "Flagship SUV popular with Kenyan executives and government fleets",
        }),
        description:
          "The Toyota Land Cruiser V8 remains the benchmark for luxury and durability on Kenyan roads. This 2018 black example with 52,000 km is ideal for executives, government use, and long-distance travel across East Africa. With its powerful V8 engine and renowned build quality, it is equally at home in Westlands traffic or on rough upcountry roads.",
      },
      {
        make: "Toyota",
        model: "Premio",
        year: 2015,
        price: 1450000,
        mileage: 88000,
        color: "Champagne Gold",
        photos: [
          "https://images.unsplash.com/photo-1549920194-4a2153c29a9a?w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop",
        ],
        specs: baseSpecs({
          engine: "1.5L Petrol",
          highlight: "Beloved Kenyan family sedan with excellent fuel economy",
        }),
        description:
          "The Toyota Premio is a favourite among Kenyan families and professionals thanks to its comfort, fuel efficiency and strong resale value. This 2015 Champagne Gold unit with 88,000 km offers a refined ride, spacious interior and low running costs — perfect for daily commutes within Nairobi and weekend trips out of town.",
      },
      {
        make: "Mazda",
        model: "Demio",
        year: 2017,
        price: 850000,
        mileage: 64000,
        color: "Deep Crystal Blue",
        photos: [
          "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1511391037251-9f6254c19c32?w=1200&auto=format&fit=crop",
        ],
        specs: baseSpecs({
          engine: "1.3L Petrol",
          highlight: "Popular hatchback for first-time car owners in Nairobi",
        }),
        description:
          "The Mazda Demio is a stylish and efficient hatchback that has become very popular among young professionals and first-time buyers in Nairobi. This 2017 example in Deep Crystal Blue with 64,000 km combines SkyActiv engine technology with a modern interior and excellent fuel consumption — ideal for daily CBD and Westlands commutes.",
      },
      {
        make: "Toyota",
        model: "Fielder",
        year: 2014,
        price: 980000,
        mileage: 110000,
        color: "White",
        photos: [
          "https://images.unsplash.com/photo-1541447271487-09612b3f49af?w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1603386828222-4e322cddb5c2?w=1200&auto=format&fit=crop",
        ],
        specs: baseSpecs({
          engine: "1.5L Hybrid",
          highlight: "Spacious estate car popular with Uber/Bolt drivers and families",
        }),
        description:
          "The Toyota Fielder hybrid is a workhorse on Kenyan roads, especially for ride-hailing drivers and small families. This 2014 white unit with 110,000 km offers generous boot space, legendary Toyota reliability and very low fuel consumption — ideal for long days on Nairobi roads.",
      },
      {
        make: "Honda",
        model: "Fit",
        year: 2015,
        price: 750000,
        mileage: 102000,
        color: "Blue",
        photos: [
          "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=1200&auto=format&fit=crop",
        ],
        specs: baseSpecs({
          engine: "1.3L Hybrid",
          highlight: "Compact hatchback with excellent fuel economy for city use",
        }),
        description:
          "The Honda Fit hybrid is a compact yet surprisingly spacious hatchback that suits Kenyan city life perfectly. This 2015 blue unit with 102,000 km offers nimble handling, a configurable rear seat layout and hybrid fuel savings — a great choice for everyday errands and CBD driving.",
      },
      {
        make: "Mitsubishi",
        model: "Outlander",
        year: 2017,
        price: 2450000,
        mileage: 73000,
        color: "Grey",
        photos: [
          "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop",
        ],
        specs: baseSpecs({
          engine: "2.0L Petrol",
          highlight: "7-seater crossover ideal for Kenyan families",
        }),
        description:
          "The Mitsubishi Outlander is a practical 7-seater crossover that handles both Nairobi potholes and out-of-town trips with ease. This 2017 grey example with 73,000 km offers flexible seating, decent ground clearance and a comfortable ride — perfect for growing families who need extra room without jumping to a full-size SUV.",
      },
    ];

    const cars = await Promise.all(
      carsData.map((c) =>
        prisma.car.create({
          data: {
            ...c,
            dealerId: dealer.id,
            status: "active",
          },
        })
      )
    );

    console.log(`Seeded ${cars.length} demo cars.`);

    // Basic demo leads + test drives + ad copy to make analytics look alive
    const demoNames = [
      "James Kariuki",
      "Mary Wanjiru",
      "Peter Ochieng",
      "Grace Muthoni",
      "Ahmed Ali",
      "Lucy Akinyi",
      "David Otieno",
      "Sarah Njeri",
      "Brian Mwangi",
      "Esther Atieno",
      "Kevin Njoroge",
      "Patricia Wairimu",
      "John Otieno",
      "Naomi Chebet",
      "Felix Kiptoo",
    ];
    const demoStatuses = [
      "NEW",
      "NEW",
      "CONTACTED",
      "TEST_DRIVE",
      "NEGOTIATION",
      "CLOSED",
      "CLOSED",
      "LOST",
      "NEW",
      "CONTACTED",
      "TEST_DRIVE",
      "NEGOTIATION",
      "CLOSED",
      "LOST",
      "NEW",
    ];
    const demoScores = [
      "hot",
      "warm",
      "cold",
      "hot",
      "warm",
      "hot",
      "hot",
      "cold",
      "warm",
      "hot",
      "warm",
      "hot",
      "hot",
      "cold",
      "warm",
    ];

    for (let i = 0; i < demoNames.length; i++) {
      const lead = await prisma.lead.create({
        data: {
          dealerId: dealer.id,
          carId: cars[i % cars.length].id,
          name: demoNames[i],
          phone: `0712${String(i).padStart(6, "0")}`,
          email: `lead${i}@demo.motoriq.co.ke`,
          budget: "1M - 4M",
          financing: i % 2 ? "cash" : "financing",
          timeframe: i % 3 === 0 ? "This week" : "This month",
          tradeIn: i % 4 === 0 ? "yes" : "no",
          source: i % 2 === 0 ? "facebook" : "instagram",
          status: demoStatuses[i],
          score: demoScores[i],
          scoreReason: "Demo dataset",
        },
      });

      if (i < 3) {
        await prisma.followUp.createMany({
          data: [
            { leadId: lead.id, day: 1, message: "Hi! Thanks for your interest in our vehicle." },
            { leadId: lead.id, day: 3, message: "Just following up — still interested?" },
            { leadId: lead.id, day: 7, message: "We have a special offer this week. Reply to learn more." },
          ],
        });
      }
    }

    const firstLead = await prisma.lead.findFirst({ where: { dealerId: dealer.id } });
    if (firstLead) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await prisma.testDrive.create({
        data: {
          dealerId: dealer.id,
          carId: cars[0].id,
          leadId: firstLead.id,
          date: tomorrow,
          timeSlot: "10:00 AM",
          status: "CONFIRMED",
        },
      });
    }

    await prisma.adCopy.create({
      data: {
        dealerId: dealer.id,
        carId: cars[0].id,
        headlines: [
          "Perfect SUV for Kenyan roads",
          "2021 Toyota Prado TX-L",
          "Low mileage, accident free",
        ],
        descriptions: [
          "One-owner, dealer maintained, ready for Nairobi & upcountry.",
          "Flexible financing options available.",
        ],
        captions: [
          "🔥 New arrival at our demo yard",
          "DM to book a test drive today",
        ],
        targetAudience: "Nairobi families and executives",
        location: "Nairobi, Kenya",
      },
    });

    // Seed a couple of demo affiliates and attach some leads/events so the affiliate panel looks alive
    // Demo affiliates for analytics/affiliate dashboard
    const affiliateA = await prisma.affiliate.upsert({
      where: { referralCode: "DEMO01" },
      update: {},
      create: {
        dealerId: dealer.id,
        name: "James Kariuki",
        email: "affiliate1@demo.motoriq.co.ke",
        phone: "0712000001",
        referralCode: "DEMO01",
        trackingUrl: "",
        status: "ACTIVE",
        payoutRate: 0.05,
        totalEarned: 24000,
      },
    });
    const affiliateB = await prisma.affiliate.upsert({
      where: { referralCode: "DEMO02" },
      update: {},
      create: {
        dealerId: dealer.id,
        name: "Sarah Wanjiku",
        email: "affiliate2@demo.motoriq.co.ke",
        phone: "0712000002",
        referralCode: "DEMO02",
        trackingUrl: "",
        status: "ACTIVE",
        payoutRate: 0.04,
        totalEarned: 16000,
      },
    });

    const affiliateLeads = await prisma.lead.findMany({
      where: { dealerId: dealer.id },
      take: 4,
      orderBy: { createdAt: "desc" },
    });
    for (let i = 0; i < affiliateLeads.length; i++) {
      const affiliate = i % 2 === 0 ? affiliateA : affiliateB;
      await prisma.lead.update({
        where: { id: affiliateLeads[i].id },
        data: { affiliateId: affiliate.id },
      });
      await prisma.referralEvent.create({
        data: {
          affiliateId: affiliate.id,
          leadId: affiliateLeads[i].id,
          eventType: "lead",
        },
      });
    }

    console.log("Demo dealer seed completed.");
    process.exit(0);
  } catch (e) {
    console.error("Seed demo dealer failed:", e?.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoDealer();

