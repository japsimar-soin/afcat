/*
  Warnings:

  - Changed the type of `source` on the `Image` table. We will migrate existing string values into the new enum safely.
*/
-- CreateEnum
CREATE TYPE "public"."ImageSource" AS ENUM ('seed', 'user', 'ai');

-- AlterTable: add new column needed by schema
ALTER TABLE "public"."Attempt" ADD COLUMN "answerImageId" TEXT;

-- Safely migrate Image.source from text to enum without data loss
-- 1) Add a temporary enum column
ALTER TABLE "public"."Image" ADD COLUMN "source_tmp" "public"."ImageSource";

-- 2) Copy data with mapping and fallback
UPDATE "public"."Image"
SET "source_tmp" = (
  CASE
    WHEN "source" IN ('seed', 'user', 'ai') THEN "source"::"public"."ImageSource"
    ELSE 'user'::"public"."ImageSource"
  END
);

-- 3) Enforce NOT NULL on the new column
ALTER TABLE "public"."Image" ALTER COLUMN "source_tmp" SET NOT NULL;

-- 4) Drop old column and rename new one
ALTER TABLE "public"."Image" DROP COLUMN "source";
ALTER TABLE "public"."Image" RENAME COLUMN "source_tmp" TO "source";

-- AddForeignKey
ALTER TABLE "public"."Attempt" ADD CONSTRAINT "Attempt_answerImageId_fkey" FOREIGN KEY ("answerImageId") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;
