/*
  Warnings:

  - A unique constraint covering the columns `[subwork_id]` on the table `Mailsubworks` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[work_id]` on the table `Mailworks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Mailsubworks_subwork_id_key" ON "Mailsubworks"("subwork_id");

-- CreateIndex
CREATE UNIQUE INDEX "Mailworks_work_id_key" ON "Mailworks"("work_id");
