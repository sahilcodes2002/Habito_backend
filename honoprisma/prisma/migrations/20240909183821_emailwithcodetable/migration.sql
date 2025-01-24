-- CreateTable
CREATE TABLE "Emailwithcode" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "code" INTEGER NOT NULL,

    CONSTRAINT "Emailwithcode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Emailwithcode_email_key" ON "Emailwithcode"("email");
