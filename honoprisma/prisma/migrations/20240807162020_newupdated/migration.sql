/*
  Warnings:

  - You are about to drop the column `crteated_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Notes` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `notifications` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `private` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Notes" DROP CONSTRAINT "Notes_folder_id_fkey";

-- DropForeignKey
ALTER TABLE "Notes" DROP CONSTRAINT "Notes_user_id_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "crteated_at",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notifications" BIGINT NOT NULL,
ADD COLUMN     "private" BOOLEAN NOT NULL;

-- DropTable
DROP TABLE "Notes";

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "folder_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "link" TEXT,
    "archive" BOOLEAN NOT NULL,
    "done" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMessages" (
    "id" SERIAL NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "important" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMessages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkTags" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "WorkTags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Works" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "work" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignto" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubWorks" (
    "id" SERIAL NOT NULL,
    "work_id" INTEGER NOT NULL,
    "subwork" TEXT NOT NULL,
    "subdescription" TEXT NOT NULL,

    CONSTRAINT "SubWorks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_user_id_idx" ON "Project"("user_id");

-- CreateIndex
CREATE INDEX "Project_folder_id_idx" ON "Project"("folder_id");

-- CreateIndex
CREATE INDEX "ProjectMessages_sender_id_idx" ON "ProjectMessages"("sender_id");

-- CreateIndex
CREATE INDEX "ProjectMessages_project_id_idx" ON "ProjectMessages"("project_id");

-- CreateIndex
CREATE INDEX "WorkTags_project_id_idx" ON "WorkTags"("project_id");

-- CreateIndex
CREATE INDEX "Works_project_id_idx" ON "Works"("project_id");

-- CreateIndex
CREATE INDEX "Works_assignto_idx" ON "Works"("assignto");

-- CreateIndex
CREATE INDEX "SubWorks_work_id_idx" ON "SubWorks"("work_id");

-- CreateIndex
CREATE INDEX "Folder_user_id_idx" ON "Folder"("user_id");

-- CreateIndex
CREATE INDEX "Message_sender_id_idx" ON "Message"("sender_id");

-- CreateIndex
CREATE INDEX "Message_receiver_id_idx" ON "Message"("receiver_id");

-- CreateIndex
CREATE INDEX "Todo_user_id_idx" ON "Todo"("user_id");

-- CreateIndex
CREATE INDEX "Todobin_user_id_idx" ON "Todobin"("user_id");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMessages" ADD CONSTRAINT "ProjectMessages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMessages" ADD CONSTRAINT "ProjectMessages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTags" ADD CONSTRAINT "WorkTags_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Works" ADD CONSTRAINT "Works_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Works" ADD CONSTRAINT "Works_assignto_fkey" FOREIGN KEY ("assignto") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubWorks" ADD CONSTRAINT "SubWorks_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "Works"("id") ON DELETE CASCADE ON UPDATE CASCADE;
