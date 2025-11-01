-- CreateEnum
CREATE TYPE "public"."Mode" AS ENUM ('PPDT', 'TAT');

-- CreateTable
CREATE TABLE "public"."UserProfile" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Image" (
    "id" TEXT NOT NULL,
    "mode" "public"."Mode" NOT NULL,
    "source" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "storageKey" TEXT NOT NULL,
    "originalKey" TEXT,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "public"."Mode" NOT NULL,
    "imageId" TEXT NOT NULL,
    "timerSeconds" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "storyText" TEXT,
    "ocrText" TEXT,
    "ocrProvider" TEXT,
    "ocrConfidence" DOUBLE PRECISION,
    "feedbackJson" JSONB,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_clerkId_key" ON "public"."UserProfile"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "Image_checksum_key" ON "public"."Image"("checksum");

-- CreateIndex
CREATE INDEX "Image_mode_isPublic_idx" ON "public"."Image"("mode", "isPublic");

-- CreateIndex
CREATE INDEX "Attempt_userId_createdAt_idx" ON "public"."Attempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Attempt_mode_createdAt_idx" ON "public"."Attempt"("mode", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Image" ADD CONSTRAINT "Image_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attempt" ADD CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attempt" ADD CONSTRAINT "Attempt_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
