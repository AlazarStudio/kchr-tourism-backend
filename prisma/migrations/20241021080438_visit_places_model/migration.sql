-- CreateTable
CREATE TABLE "VisitPlaces" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "text" TEXT NOT NULL,
    "images" TEXT[],

    CONSTRAINT "VisitPlaces_pkey" PRIMARY KEY ("id")
);
