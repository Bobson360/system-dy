-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "priority_charges" (
    "id" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "lawyerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "status" "ChargeStatus" NOT NULL DEFAULT 'PENDING',
    "pixCode" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "priority_charges_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "priority_charges" ADD CONSTRAINT "priority_charges_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "demands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "priority_charges" ADD CONSTRAINT "priority_charges_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "lawyer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
