/*
  Warnings:

  - Added the required column `creatorId` to the `Invite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "creatorId" TEXT NOT NULL,
ALTER COLUMN "expires" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
