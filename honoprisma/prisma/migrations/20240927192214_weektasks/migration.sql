-- CreateTable
CREATE TABLE "Weektask" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "task" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL,

    CONSTRAINT "Weektask_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Weektask" ADD CONSTRAINT "Weektask_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
