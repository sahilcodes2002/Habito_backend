/*
  Warnings:

  - Added the required column `completed` to the `SubWorks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `completed` to the `Works` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubWorks" ADD COLUMN     "completed" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "Works" ADD COLUMN     "completed" BOOLEAN NOT NULL;
