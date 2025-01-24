/*
  Warnings:

  - Added the required column `user_id` to the `Folderproject` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Folderproject" ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Folderproject" ADD CONSTRAINT "Folderproject_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
