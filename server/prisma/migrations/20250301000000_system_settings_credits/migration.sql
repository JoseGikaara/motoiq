-- CreateEnum
CREATE TYPE "TopUpStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'REJECTED');

-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "creditsAfter" INTEGER,
ADD COLUMN     "creditsUsed" INTEGER;

-- AlterTable
ALTER TABLE "Dealer" ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalCreditsUsed" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "setupFeeStarter" INTEGER NOT NULL DEFAULT 70000,
    "setupFeeProfessional" INTEGER NOT NULL DEFAULT 70000,
    "setupFeeEnterprise" INTEGER NOT NULL DEFAULT 70000,
    "originalFeeStarter" INTEGER NOT NULL DEFAULT 90000,
    "originalFeeProfessional" INTEGER NOT NULL DEFAULT 90000,
    "originalFeeEnterprise" INTEGER NOT NULL DEFAULT 90000,
    "creditsStarter" INTEGER NOT NULL DEFAULT 100,
    "creditsProfessional" INTEGER NOT NULL DEFAULT 300,
    "creditsEnterprise" INTEGER NOT NULL DEFAULT 600,
    "creditTopUpOptions" TEXT NOT NULL DEFAULT '[{"credits":50,"price":5000},{"credits":150,"price":12000},{"credits":400,"price":25000}]',
    "creditCostAiScore" INTEGER NOT NULL DEFAULT 1,
    "creditCostFollowup" INTEGER NOT NULL DEFAULT 2,
    "creditCostAdCopy" INTEGER NOT NULL DEFAULT 3,
    "creditCostReport" INTEGER NOT NULL DEFAULT 5,
    "mpesaEnabled" BOOLEAN NOT NULL DEFAULT true,
    "mpesaPaybill" TEXT DEFAULT '522522',
    "mpesaTill" TEXT,
    "mpesaInstructions" TEXT DEFAULT 'Go to M-Pesa → Lipa na M-Pesa → Pay Bill',
    "bankEnabled" BOOLEAN NOT NULL DEFAULT true,
    "bankName" TEXT DEFAULT 'Equity Bank',
    "bankAccountName" TEXT DEFAULT 'MotorIQ Limited',
    "bankAccountNumber" TEXT DEFAULT '1234567890',
    "bankBranch" TEXT DEFAULT 'Westlands, Nairobi',
    "bankSwiftCode" TEXT,
    "bankInstructions" TEXT,
    "equityEnabled" BOOLEAN NOT NULL DEFAULT true,
    "equityNumber" TEXT DEFAULT '0712 345 678',
    "equityInstructions" TEXT DEFAULT 'Equity Mobile: *247#',
    "customMethodEnabled" BOOLEAN NOT NULL DEFAULT false,
    "customMethodName" TEXT,
    "customMethodDetails" TEXT,
    "customMethodInstructions" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTopUpRequest" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "packageCredits" INTEGER NOT NULL,
    "packagePrice" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentRef" TEXT,
    "paymentProof" TEXT,
    "status" "TopUpStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTopUpRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CreditTopUpRequest" ADD CONSTRAINT "CreditTopUpRequest_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
