/*
  Warnings:

  - Added the required column `completed` to the `Todobin` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Todobin" ADD COLUMN     "completed" BOOLEAN NOT NULL;
