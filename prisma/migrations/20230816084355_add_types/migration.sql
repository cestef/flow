/*
  Warnings:

  - Added the required column `type` to the `Edge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Node` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Edge" ADD COLUMN     "type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Node" ADD COLUMN     "type" TEXT NOT NULL;
