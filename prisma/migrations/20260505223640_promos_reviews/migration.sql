/*
  Warnings:

  - You are about to drop the column `discountPercent` on the `PromoCode` table. All the data in the column will be lost.
  - Added the required column `discountValue` to the `PromoCode` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "PromoCode" DROP COLUMN "discountPercent",
ADD COLUMN     "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN     "discountValue" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "usageLimit" INTEGER,
ADD COLUMN     "usedCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false;
