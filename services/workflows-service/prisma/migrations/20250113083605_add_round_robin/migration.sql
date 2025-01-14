-- CreateEnum
CREATE TYPE "RoundRobinType" AS ENUM ('lead', 'ticket');

-- CreateTable
CREATE TABLE "RoundRobin" (
    "id" TEXT NOT NULL,
    "type" "RoundRobinType" NOT NULL,
    "userId" TEXT NOT NULL,
    "serialNumber" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,

    CONSTRAINT "RoundRobin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDetails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serialNumber" INTEGER NOT NULL,
    "roundRobinId" TEXT NOT NULL,

    CONSTRAINT "UserDetails_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserDetails" ADD CONSTRAINT "UserDetails_roundRobinId_fkey" FOREIGN KEY ("roundRobinId") REFERENCES "RoundRobin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
