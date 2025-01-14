/*
  Warnings:

  - A unique constraint covering the columns `[type]` on the table `RoundRobin` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RoundRobin_type_key" ON "RoundRobin"("type");
