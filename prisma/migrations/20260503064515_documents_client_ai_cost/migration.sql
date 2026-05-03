-- AlterTable
ALTER TABLE "ai_analyses" ADD COLUMN     "durationMs" INTEGER,
ADD COLUMN     "estimatedCostUsd" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "clientId" TEXT,
ALTER COLUMN "demandId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "client_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
