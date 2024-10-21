/*
  Warnings:

  - Added the required column `src` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "src" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;
