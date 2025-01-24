/*
  Warnings:

  - Added the required column `project_id` to the `SubWorks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubWorks" ADD COLUMN     "project_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "SubWorks" ADD CONSTRAINT "SubWorks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
