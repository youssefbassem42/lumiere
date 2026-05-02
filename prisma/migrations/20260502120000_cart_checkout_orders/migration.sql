-- Sprint 3-5: cart, checkout, orders hardening.

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'FAILED';

ALTER TABLE "Address"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "CartItem"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ALTER COLUMN "shippingFee" SET DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'usd';

UPDATE "Order"
SET
  "shippingFee" = COALESCE("shippingFee", 0),
  "subtotal" = COALESCE("subtotal", GREATEST("totalAmount" - COALESCE("shippingFee", 0), 0));

ALTER TABLE "Order"
  ALTER COLUMN "shippingFee" SET NOT NULL,
  ALTER COLUMN "subtotal" SET NOT NULL;

ALTER TABLE "OrderItem"
  ADD COLUMN IF NOT EXISTS "productName" TEXT,
  ADD COLUMN IF NOT EXISTS "productSlug" TEXT,
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

UPDATE "OrderItem" oi
SET
  "productName" = COALESCE(oi."productName", p."name"),
  "productSlug" = COALESCE(oi."productSlug", p."slug")
FROM "Product" p
WHERE p."id" = oi."productId";

ALTER TABLE "OrderItem"
  ALTER COLUMN "productName" SET NOT NULL,
  ALTER COLUMN "productSlug" SET NOT NULL;

ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "providerOrderId" TEXT,
  ADD COLUMN IF NOT EXISTS "clientSecret" TEXT,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS "failureReason" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Address_userId_idx" ON "Address"("userId");
CREATE INDEX IF NOT EXISTS "CartItem_productId_idx" ON "CartItem"("productId");
CREATE INDEX IF NOT EXISTS "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE INDEX IF NOT EXISTS "Payment_provider_transactionId_idx" ON "Payment"("provider", "transactionId");
CREATE INDEX IF NOT EXISTS "Payment_provider_providerOrderId_idx" ON "Payment"("provider", "providerOrderId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
