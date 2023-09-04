/*
  Warnings:

  - A unique constraint covering the columns `[tempId]` on the table `NodeHandle` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "NodeHandle" ADD COLUMN     "tempId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "NodeHandle_tempId_key" ON "NodeHandle"("tempId");
