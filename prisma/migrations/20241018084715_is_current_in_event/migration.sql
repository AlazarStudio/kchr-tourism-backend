/*
  Warnings:

  - Added the required column `is_current` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "is_current" BOOLEAN NOT NULL;
