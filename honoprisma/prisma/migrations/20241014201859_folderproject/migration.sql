-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "folderproject_id" INTEGER;

-- CreateTable
CREATE TABLE "Folderproject" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "important" BOOLEAN NOT NULL,
    "color" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "Folderproject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_folderproject_id_idx" ON "Project"("folderproject_id");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_folderproject_id_fkey" FOREIGN KEY ("folderproject_id") REFERENCES "Folderproject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folderproject" ADD CONSTRAINT "Folderproject_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folderproject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
