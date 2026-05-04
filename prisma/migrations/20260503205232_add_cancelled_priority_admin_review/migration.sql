-- AlterEnum
ALTER TYPE "DemandStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_reviewerId_fkey";

-- AlterTable
ALTER TABLE "demands" ADD COLUMN     "isPriority" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "reviews" ALTER COLUMN "reviewerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "reviewer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
