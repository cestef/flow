/*
  Warnings:

  - You are about to drop the column `x` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `y` on the `Comment` table. All the data in the column will be lost.
  - Made the column `nodeId` on table `Comment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "x",
DROP COLUMN "y",
ALTER COLUMN "nodeId" SET NOT NULL;
