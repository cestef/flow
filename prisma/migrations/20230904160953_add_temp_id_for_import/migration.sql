/*
  Warnings:

  - A unique constraint covering the columns `[tempId]` on the table `Node` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Node" ADD COLUMN     "tempId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Node_tempId_key" ON "Node"("tempId");
