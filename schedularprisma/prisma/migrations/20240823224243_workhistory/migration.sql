-- CreateTable
CREATE TABLE "Workhistory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "hoursWorked" INTEGER NOT NULL,
    "minsWorked" INTEGER NOT NULL,
    "startHour" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workhistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Workhistory_user_id_idx" ON "Workhistory"("user_id");

-- AddForeignKey
ALTER TABLE "Workhistory" ADD CONSTRAINT "Workhistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
