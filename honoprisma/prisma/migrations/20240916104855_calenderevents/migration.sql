-- CreateTable
CREATE TABLE "Calenderevents" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "Calenderevents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Calenderevents" ADD CONSTRAINT "Calenderevents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
