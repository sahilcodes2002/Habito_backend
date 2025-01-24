-- CreateTable
CREATE TABLE "Codestore" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Codestore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Codestore_user_id_idx" ON "Codestore"("user_id");

-- AddForeignKey
ALTER TABLE "Codestore" ADD CONSTRAINT "Codestore_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
