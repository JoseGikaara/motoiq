-- CreateEnum
CREATE TYPE "DripChannel" AS ENUM ('SMS', 'WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'STOPPED');

-- AlterTable
ALTER TABLE "Dealer" ADD COLUMN "commissionRate" DECIMAL(5,4),
ADD COLUMN "currency" TEXT DEFAULT 'KES',
ADD COLUMN "monthlyTargetDeals" INTEGER;

-- AlterTable Lead dealValue (for closed deal value / commission)
ALTER TABLE "Lead" ADD COLUMN "dealValue" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "DripSequence" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DripSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DripStep" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "triggerAfterDays" INTEGER NOT NULL,
    "channel" "DripChannel" NOT NULL,
    "templateText" TEXT NOT NULL,
    "useAI" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DripStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadDripEnrollment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" TIMESTAMP(3),
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "LeadDripEnrollment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DripSequence" ADD CONSTRAINT "DripSequence_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DripStep" ADD CONSTRAINT "DripStep_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "DripSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDripEnrollment" ADD CONSTRAINT "LeadDripEnrollment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDripEnrollment" ADD CONSTRAINT "LeadDripEnrollment_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "DripSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
