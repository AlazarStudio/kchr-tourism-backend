-- AlterTable
ALTER TABLE "News" ADD COLUMN "videos" TEXT[] DEFAULT ARRAY[]::TEXT[];
