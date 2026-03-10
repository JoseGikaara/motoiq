-- CreateEnum
CREATE TYPE "CarPhotoAngle" AS ENUM ('FRONT', 'FRONT_LEFT', 'FRONT_RIGHT', 'REAR', 'REAR_LEFT', 'REAR_RIGHT', 'LEFT_SIDE', 'RIGHT_SIDE', 'INTERIOR_DASH', 'INTERIOR_SEATS', 'INTERIOR_BACKSEATS', 'INTERIOR_CARGO', 'INTERIOR_DETAILS', 'ENGINE', 'WHEELS', 'TRUNK', 'ROOF', 'UNDERNEATH', 'DETAIL_SHOT', 'OTHER');

-- CreateEnum
CREATE TYPE "CarPhotoType" AS ENUM ('STANDARD', 'HERO', 'THUMBNAIL', 'GALLERY', 'ANGLE_360');

-- CreateTable
CREATE TABLE "CarPhoto" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "optimizedUrl" TEXT,
    "thumbnailUrl" TEXT,
    "blurHash" TEXT,
    "angle" "CarPhotoAngle" NOT NULL DEFAULT 'OTHER',
    "photoType" "CarPhotoType" NOT NULL DEFAULT 'GALLERY',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "description" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarPhoto_carId_angle_idx" ON "CarPhoto"("carId", "angle");

-- CreateIndex
CREATE INDEX "CarPhoto_carId_isPrimary_idx" ON "CarPhoto"("carId", "isPrimary");

-- AddForeignKey
ALTER TABLE "CarPhoto" ADD CONSTRAINT "CarPhoto_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
