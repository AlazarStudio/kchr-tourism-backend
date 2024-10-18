-- CreateTable
CREATE TABLE "AboutUs" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "text" TEXT NOT NULL,
    "images" TEXT[],

    CONSTRAINT "AboutUs_pkey" PRIMARY KEY ("id")
);
