/*
  Warnings:

  - You are about to drop the column `userId` on the `Node` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Node" DROP CONSTRAINT "Node_userId_fkey";

-- AlterTable
ALTER TABLE "Node" DROP COLUMN "userId",
ADD COLUMN     "presetCanvasId" TEXT;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_presetCanvasId_fkey" FOREIGN KEY ("presetCanvasId") REFERENCES "Canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
