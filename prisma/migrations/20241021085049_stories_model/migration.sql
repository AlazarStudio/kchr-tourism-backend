-- CreateTable
CREATE TABLE "Stories" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "date" TIMESTAMP(3),
    "text" TEXT,
    "images" TEXT[],

    CONSTRAINT "Stories_pkey" PRIMARY KEY ("id")
);
