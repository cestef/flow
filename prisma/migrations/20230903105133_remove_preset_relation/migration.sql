/*
  Warnings:

  - You are about to drop the column `presetCanvasId` on the `Node` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Node" DROP CONSTRAINT "Node_presetCanvasId_fkey";

-- AlterTable
ALTER TABLE "Node" DROP COLUMN "presetCanvasId",
ADD COLUMN     "preset" BOOLEAN NOT NULL DEFAULT false;
