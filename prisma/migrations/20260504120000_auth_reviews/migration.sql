-- Advanced auth and trusted reviews.

DO $$ BEGIN
  CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerificationExpiry" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "gender" "Gender",
  ADD COLUMN IF NOT EXISTS "resetToken" TEXT,
  ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

ALTER TABLE "User"
  ALTER COLUMN "password" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "Account"
  ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE INDEX IF NOT EXISTS "User_emailVerificationToken_idx" ON "User"("emailVerificationToken");
CREATE INDEX IF NOT EXISTS "User_resetToken_idx" ON "User"("resetToken");

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Review"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Review" SET "comment" = '' WHERE "comment" IS NULL;

ALTER TABLE "Review"
  ALTER COLUMN "rating" TYPE DOUBLE PRECISION USING "rating"::DOUBLE PRECISION,
  ALTER COLUMN "comment" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "ReviewReply" (
  "id" TEXT NOT NULL,
  "comment" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  CONSTRAINT "ReviewReply_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ReviewReply"
  ADD CONSTRAINT "ReviewReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewReply"
  ADD CONSTRAINT "ReviewReply_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Review_productId_createdAt_idx" ON "Review"("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "ReviewReply_reviewId_createdAt_idx" ON "ReviewReply"("reviewId", "createdAt");
CREATE INDEX IF NOT EXISTS "ReviewReply_userId_idx" ON "ReviewReply"("userId");

UPDATE "Product" p
SET
  "avgRating" = COALESCE(r."avgRating", 0),
  "reviewCount" = COALESCE(r."reviewCount", 0)
FROM (
  SELECT "productId", ROUND(AVG("rating")::numeric, 1)::double precision AS "avgRating", COUNT(*)::integer AS "reviewCount"
  FROM "Review"
  GROUP BY "productId"
) r
WHERE p."id" = r."productId";
