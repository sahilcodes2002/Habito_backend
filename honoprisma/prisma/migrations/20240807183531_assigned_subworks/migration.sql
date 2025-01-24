/*
  Warnings:

  - Added the required column `assignto` to the `SubWorks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubWorks" ADD COLUMN     "assignto" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "SubWorks" ADD CONSTRAINT "SubWorks_assignto_fkey" FOREIGN KEY ("assignto") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
