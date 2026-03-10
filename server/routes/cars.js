import { Router } from "express";
import multer from "multer";
import { parse as parseCsv } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { requireAuth } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { logActivity, getClientIp } from "../utils/activityLog.js";

export const carsRouter = Router();

// Public: get car for landing page (no auth)
carsRouter.get("/public/:id", async (req, res) => {
  try {
    const car = await prisma.car.findUnique({
      where: { id: req.params.id },
      include: { dealer: { select: { id: true, dealershipName: true, phone: true, logoUrl: true, primaryColor: true, tagline: true } } },
    });
    if (!car) return res.status(404).json({ error: "Car not found" });
    res.json(car);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch car" });
  }
});

carsRouter.use(requireAuth);

const bulkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok =
      /^text\/csv$/i.test(file.mimetype) ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    cb(null, ok);
  },
});

function normalizePhotoGallery(gallery) {
  if (!Array.isArray(gallery) || gallery.length === 0) return null;
  return gallery.map((item, i) => ({
    url: typeof item === "string" ? item : (item?.url || ""),
    angle: typeof item === "object" && item?.angle ? String(item.angle) : null,
    order: typeof item === "object" && item?.order != null ? Number(item.order) : i,
  })).filter((item) => item.url);
}

carsRouter.post("/", async (req, res) => {
  try {
    const { make, model, year, price, mileage, color, specs, description, photos, photoGallery, status, isFeaturedInTopMarquee, isFeaturedInCinematicHero, heroDisplayOrder, heroOverlayText, discountPercentage, saleEndDate, videoUrl, videoThumbnailUrl, isVideoBackground } = req.body;
    if (!make || !model || !year || price == null) {
      return res.status(400).json({ error: "Make, model, year and price required" });
    }
    const gallery = normalizePhotoGallery(photoGallery);
    const photoUrls = gallery?.length ? gallery.map((g) => g.url) : (Array.isArray(photos) ? photos : []);
    const car = await prisma.car.create({
      data: {
        dealerId: req.dealer.id,
        make,
        model,
        year: Number(year),
        price: Number(price),
        mileage: mileage != null ? Number(mileage) : null,
        color: color || null,
        specs: specs || null,
        description: description || null,
        photos: photoUrls,
        photoGallery: gallery?.length ? gallery : undefined,
        isFeaturedInTopMarquee: Boolean(isFeaturedInTopMarquee),
        isFeaturedInCinematicHero: Boolean(isFeaturedInCinematicHero),
        heroDisplayOrder: heroDisplayOrder != null && heroDisplayOrder !== "" ? Math.min(10, Math.max(1, Number(heroDisplayOrder))) : null,
        heroOverlayText: heroOverlayText && String(heroOverlayText).trim() ? String(heroOverlayText).trim() : null,
        discountPercentage: discountPercentage != null && discountPercentage !== "" ? Math.min(100, Math.max(0, Number(discountPercentage))) : null,
        saleEndDate: saleEndDate ? new Date(saleEndDate) : null,
        videoUrl: videoUrl && String(videoUrl).trim() ? String(videoUrl).trim() : null,
        videoThumbnailUrl: videoThumbnailUrl && String(videoThumbnailUrl).trim() ? String(videoThumbnailUrl).trim() : null,
        isVideoBackground: Boolean(isVideoBackground),
        status: status || "active",
      },
      include: { dealer: { select: { dealershipName: true } } },
    });
    logActivity({
      dealerId: req.dealer.id,
      action: "CAR_ADDED",
      detail: `${car.make} ${car.model} ${car.year}`,
      ip: getClientIp(req),
    }).catch(() => {});
    res.json(car);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create car" });
  }
});

carsRouter.post("/bulk-upload", bulkUpload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const dealerId = req.dealer.id;
    const mime = req.file.mimetype || "";
    const buffer = req.file.buffer;
    let rows = [];

    if (/^text\/csv$/i.test(mime) || /\.csv$/i.test(req.file.originalname || "")) {
      const text = buffer.toString("utf8");
      rows = parseCsv(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } else {
      // Treat as Excel
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return res.status(400).json({ error: "No sheets found in uploaded file" });
      }
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    }

    function pick(row, name) {
      const key = Object.keys(row).find((k) => k.toLowerCase() === name.toLowerCase());
      return key ? row[key] : undefined;
    }

    let carsCreated = 0;
    let rowsSkipped = 0;
    const errors = [];

    // Assume headers are on row 1, so first data row is row 2
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] || {};
      const rowNumber = i + 2;

      try {
        const makeRaw = pick(row, "make");
        const modelRaw = pick(row, "model");
        const yearRaw = pick(row, "year");
        const priceRaw = pick(row, "price");

        const make = (makeRaw ?? "").toString().trim();
        const model = (modelRaw ?? "").toString().trim();
        if (!make || !model) {
          rowsSkipped += 1;
          errors.push({ row: rowNumber, reason: "Make and model required" });
          continue;
        }

        const year = Number(yearRaw);
        if (!Number.isFinite(year) || year <= 0) {
          rowsSkipped += 1;
          errors.push({ row: rowNumber, reason: "Year invalid" });
          continue;
        }

        const price = Number(priceRaw);
        if (!Number.isFinite(price) || price <= 0) {
          rowsSkipped += 1;
          errors.push({ row: rowNumber, reason: "Price invalid" });
          continue;
        }

        const mileageRaw = pick(row, "mileage");
        const fuelType = (pick(row, "fuelType") ?? "").toString().trim();
        const transmission = (pick(row, "transmission") ?? "").toString().trim();
        const bodyType = (pick(row, "bodyType") ?? "").toString().trim();
        const color = (pick(row, "color") ?? "").toString().trim();
        const description = (pick(row, "description") ?? "").toString().trim() || null;
        const heroRaw = pick(row, "hero");
        const statusRaw = (pick(row, "status") ?? "").toString().trim();

        const mileage =
          mileageRaw == null || mileageRaw === ""
            ? null
            : Number(mileageRaw);

        if (mileage != null && !Number.isFinite(mileage)) {
          rowsSkipped += 1;
          errors.push({ row: rowNumber, reason: "Mileage invalid" });
          continue;
        }

        const hero =
          typeof heroRaw === "boolean"
            ? heroRaw
            : (heroRaw ?? "").toString().toLowerCase() === "true";

        let status = statusRaw || "active";
        if (status.toUpperCase() === "AVAILABLE") {
          status = "active";
        }

        const specsObj = {};
        if (fuelType) specsObj.fuelType = fuelType;
        if (transmission) specsObj.transmission = transmission;
        if (bodyType) specsObj.bodyType = bodyType;
        const specs =
          Object.keys(specsObj).length > 0 ? JSON.stringify(specsObj) : null;

        await prisma.car.create({
          data: {
            dealerId,
            make,
            model,
            year,
            price,
            mileage,
            color: color || null,
            specs,
            description,
            photos: [],
            status,
            isFeaturedInTopMarquee: hero,
            isFeaturedInCinematicHero: hero,
          },
        });

        carsCreated += 1;
      } catch (e) {
        rowsSkipped += 1;
        errors.push({
          row: rowNumber,
          reason: e?.message || "Failed to create car",
        });
      }
    }

    logActivity({
      dealerId,
      action: "CAR_BULK_UPLOAD",
      detail: `Bulk upload: ${carsCreated} cars created, ${rowsSkipped} rows skipped`,
      ip: getClientIp(req),
    }).catch(() => {});

    res.json({
      carsCreated,
      rowsSkipped,
      errors,
    });
  } catch (e) {
    console.error("Bulk upload error:", e);
    res.status(500).json({ error: "Bulk upload failed" });
  }
});

/** GET /api/cars/:carId/facebook-replies — reply templates for Facebook comments (car link + WhatsApp, source=facebook_comment) */
carsRouter.get("/:carId/facebook-replies", async (req, res) => {
  try {
    const car = await prisma.car.findFirst({
      where: { id: req.params.carId, dealerId: req.dealer.id },
      include: { dealer: { select: { phone: true } } },
    });
    if (!car) return res.status(404).json({ error: "Car not found" });

    const baseUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "https://motoriq.co";
    const carLink = `${baseUrl.replace(/\/$/, "")}/car/${car.id}?source=facebook_comment`;
    let dealerPhone = (car.dealer?.phone || "").replace(/\D/g, "");
    if (dealerPhone.startsWith("0")) dealerPhone = "254" + dealerPhone.slice(1);
    if (dealerPhone && !dealerPhone.startsWith("254")) dealerPhone = "254" + dealerPhone;
    const whatsappLink = dealerPhone ? `https://wa.me/${dealerPhone}` : "";

    const title = `${car.year} ${car.make} ${car.model}`;
    const priceStr = `KES ${(car.price || 0).toLocaleString()}`;

    const replies = [
      {
        text: `Hi! The car is still available.\n\nView photos and details:\n${carLink}\n\nWhatsApp me directly:\n${whatsappLink || "See listing"}`,
      },
      {
        text: `Yes, still available! ${title} – ${priceStr}.\n\nFull details & photos: ${carLink}\n\nWhatsApp: ${whatsappLink || "PM me"}`,
      },
      {
        text: `Hi! Thanks for your interest. You can see all details and photos here: ${carLink}\n\nOr WhatsApp me: ${whatsappLink || "number in listing"}`,
      },
    ];

    res.json({ replies });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch Facebook replies" });
  }
});

carsRouter.get("/", async (req, res) => {
  try {
    const cars = await prisma.car.findMany({
      where: { dealerId: req.dealer.id },
      include: {
        _count: { select: { leads: true } },
        carPhotos: { take: 1, orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }] },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(cars);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch cars" });
  }
});

/** GET /api/cars/:carId/photos — list photos for car (optional ?angle=) */
carsRouter.get("/:carId/photos", async (req, res) => {
  try {
    const car = await prisma.car.findFirst({
      where: { id: req.params.carId, dealerId: req.dealer.id },
    });
    if (!car) return res.status(404).json({ error: "Car not found" });
    const angle = req.query.angle;
    const where = { carId: car.id };
    if (angle) where.angle = angle;
    const photos = await prisma.carPhoto.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    });
    res.json(photos);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

/** POST /api/cars/:carId/photos — create photo records (body: { photos: [{ url, angle?, displayOrder?, isPrimary?, title? }] }) */
carsRouter.post("/:carId/photos", async (req, res) => {
  try {
    const car = await prisma.car.findFirst({
      where: { id: req.params.carId, dealerId: req.dealer.id },
    });
    if (!car) return res.status(404).json({ error: "Car not found" });
    const { photos: photosPayload } = req.body || {};
    const items = Array.isArray(photosPayload) ? photosPayload : [];
    if (items.length === 0) return res.status(400).json({ error: "photos array required" });
    const maxOrder = await prisma.carPhoto.findMany({ where: { carId: car.id }, orderBy: { displayOrder: "desc" }, take: 1 }).then((r) => r[0]?.displayOrder ?? -1);
    const created = [];
    for (let i = 0; i < items.length; i++) {
      const p = items[i];
      const url = typeof p === "string" ? p : p?.url;
      if (!url) continue;
      const isFirst = created.length === 0 && (await prisma.carPhoto.count({ where: { carId: car.id } })) === 0;
      const photo = await prisma.carPhoto.create({
        data: {
          carId: car.id,
          url: String(url).trim(),
          angle: p?.angle && isValidAngle(p.angle) ? p.angle : "OTHER",
          displayOrder: p?.displayOrder != null ? Number(p.displayOrder) : maxOrder + 1 + i,
          isPrimary: p?.isPrimary === true || isFirst,
          title: p?.title ? String(p.title).trim() : null,
        },
      });
      created.push(photo);
    }
    if (created.length > 1 && created.some((c) => c.isPrimary)) {
      const primaryId = created.find((c) => c.isPrimary)?.id;
      if (primaryId) await prisma.carPhoto.updateMany({ where: { carId: car.id, id: { not: primaryId } }, data: { isPrimary: false } });
    }
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create photos" });
  }
});

function isValidAngle(a) {
  const angles = ["FRONT", "FRONT_LEFT", "FRONT_RIGHT", "REAR", "REAR_LEFT", "REAR_RIGHT", "LEFT_SIDE", "RIGHT_SIDE", "INTERIOR_DASH", "INTERIOR_SEATS", "INTERIOR_BACKSEATS", "INTERIOR_CARGO", "INTERIOR_DETAILS", "ENGINE", "WHEELS", "TRUNK", "ROOF", "UNDERNEATH", "DETAIL_SHOT", "OTHER"];
  return angles.includes(String(a));
}

/** PUT /api/cars/:carId/photos/reorder — body: { order: [{ id, displayOrder }] } */
carsRouter.put("/:carId/photos/reorder", async (req, res) => {
  try {
    const car = await prisma.car.findFirst({
      where: { id: req.params.carId, dealerId: req.dealer.id },
    });
    if (!car) return res.status(404).json({ error: "Car not found" });
    const { order } = req.body || {};
    if (!Array.isArray(order)) return res.status(400).json({ error: "order array required" });
    for (const item of order) {
      if (item.id && Number.isInteger(item.displayOrder)) {
        await prisma.carPhoto.updateMany({
          where: { id: item.id, carId: car.id },
          data: { displayOrder: item.displayOrder },
        });
      }
    }
    const photos = await prisma.carPhoto.findMany({ where: { carId: car.id }, orderBy: { displayOrder: "asc" } });
    res.json(photos);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to reorder" });
  }
});

/** PATCH /api/cars/:carId/photos/:photoId */
carsRouter.patch("/:carId/photos/:photoId", async (req, res) => {
  try {
    const car = await prisma.car.findFirst({
      where: { id: req.params.carId, dealerId: req.dealer.id },
    });
    if (!car) return res.status(404).json({ error: "Car not found" });
    const photo = await prisma.carPhoto.findFirst({
      where: { id: req.params.photoId, carId: car.id },
    });
    if (!photo) return res.status(404).json({ error: "Photo not found" });
    const { angle, isPrimary, title, description, displayOrder } = req.body || {};
    const data = {};
    if (angle !== undefined && isValidAngle(angle)) data.angle = angle;
    if (isPrimary !== undefined) data.isPrimary = Boolean(isPrimary);
    if (title !== undefined) data.title = title ? String(title).trim() : null;
    if (description !== undefined) data.description = description ? String(description).trim() : null;
    if (displayOrder !== undefined && Number.isInteger(Number(displayOrder))) data.displayOrder = Number(displayOrder);
    if (data.isPrimary) {
      await prisma.carPhoto.updateMany({ where: { carId: car.id }, data: { isPrimary: false } });
    }
    const updated = await prisma.carPhoto.update({
      where: { id: photo.id },
      data,
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update photo" });
  }
});

/** DELETE /api/cars/:carId/photos/:photoId */
carsRouter.delete("/:carId/photos/:photoId", async (req, res) => {
  try {
    const car = await prisma.car.findFirst({
      where: { id: req.params.carId, dealerId: req.dealer.id },
    });
    if (!car) return res.status(404).json({ error: "Car not found" });
    const photo = await prisma.carPhoto.findFirst({
      where: { id: req.params.photoId, carId: car.id },
    });
    if (!photo) return res.status(404).json({ error: "Photo not found" });
    await prisma.carPhoto.delete({ where: { id: photo.id } });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete photo" });
  }
});

carsRouter.get("/:id", async (req, res) => {
  try {
    const car = await prisma.car.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
      include: { _count: { select: { leads: true } }, carPhotos: { orderBy: [{ displayOrder: "asc" }] } },
    });
    if (!car) return res.status(404).json({ error: "Car not found" });
    res.json(car);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch car" });
  }
});

carsRouter.patch("/:id", async (req, res) => {
  try {
    const { make, model, year, price, mileage, color, specs, description, photos, photoGallery, status, isFeaturedInTopMarquee, isFeaturedInCinematicHero, heroDisplayOrder, heroOverlayText, discountPercentage, saleEndDate, videoUrl, videoThumbnailUrl, isVideoBackground } = req.body;
    const car = await prisma.car.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
    });
    if (!car) return res.status(404).json({ error: "Car not found" });
    const data = {};
    if (make !== undefined) data.make = make;
    if (model !== undefined) data.model = model;
    if (year !== undefined) data.year = Number(year);
    if (price !== undefined) data.price = Number(price);
    if (mileage !== undefined) data.mileage = mileage == null || mileage === "" ? null : Number(mileage);
    if (color !== undefined) data.color = color || null;
    if (specs !== undefined) data.specs = specs || null;
    if (description !== undefined) data.description = description || null;
    if (photoGallery !== undefined) {
      const gallery = normalizePhotoGallery(photoGallery);
      data.photoGallery = gallery?.length ? gallery : null;
      data.photos = gallery?.length ? gallery.map((g) => g.url) : (Array.isArray(photos) ? photos : []);
    } else if (Array.isArray(photos)) data.photos = photos;
    if (status !== undefined) data.status = status;
    if (isFeaturedInTopMarquee !== undefined) data.isFeaturedInTopMarquee = Boolean(isFeaturedInTopMarquee);
    if (isFeaturedInCinematicHero !== undefined) data.isFeaturedInCinematicHero = Boolean(isFeaturedInCinematicHero);
    if (heroDisplayOrder !== undefined) data.heroDisplayOrder = heroDisplayOrder == null || heroDisplayOrder === "" ? null : Math.min(10, Math.max(1, Number(heroDisplayOrder)));
    if (heroOverlayText !== undefined) data.heroOverlayText = heroOverlayText && String(heroOverlayText).trim() ? String(heroOverlayText).trim() : null;
    if (discountPercentage !== undefined) data.discountPercentage = discountPercentage == null || discountPercentage === "" ? null : Math.min(100, Math.max(0, Number(discountPercentage)));
    if (saleEndDate !== undefined) data.saleEndDate = saleEndDate ? new Date(saleEndDate) : null;
    if (videoUrl !== undefined) data.videoUrl = videoUrl && String(videoUrl).trim() ? String(videoUrl).trim() : null;
    if (videoThumbnailUrl !== undefined) data.videoThumbnailUrl = videoThumbnailUrl && String(videoThumbnailUrl).trim() ? String(videoThumbnailUrl).trim() : null;
    if (isVideoBackground !== undefined) data.isVideoBackground = Boolean(isVideoBackground);
    const updated = await prisma.car.update({
      where: { id: car.id },
      data,
      include: { _count: { select: { leads: true } } },
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update car" });
  }
});

carsRouter.delete("/:id", async (req, res) => {
  try {
    const car = await prisma.car.findFirst({
      where: { id: req.params.id, dealerId: req.dealer.id },
    });
    if (!car) return res.status(404).json({ error: "Car not found" });
    await prisma.car.delete({ where: { id: car.id } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete car" });
  }
});
