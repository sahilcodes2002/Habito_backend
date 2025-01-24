-- CreateTable
CREATE TABLE "Mailworks" (
    "id" SERIAL NOT NULL,
    "work_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "email" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,

    CONSTRAINT "Mailworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mailsubworks" (
    "id" SERIAL NOT NULL,
    "subwork_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "email" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,

    CONSTRAINT "Mailsubworks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Mailworks" ADD CONSTRAINT "Mailworks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mailworks" ADD CONSTRAINT "Mailworks_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "Works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mailsubworks" ADD CONSTRAINT "Mailsubworks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mailsubworks" ADD CONSTRAINT "Mailsubworks_subwork_id_fkey" FOREIGN KEY ("subwork_id") REFERENCES "SubWorks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
