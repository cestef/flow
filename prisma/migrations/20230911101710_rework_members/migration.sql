/*
  Warnings:

  - You are about to drop the `_InvitedTo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_InvitedTo" DROP CONSTRAINT "_InvitedTo_A_fkey";

-- DropForeignKey
ALTER TABLE "_InvitedTo" DROP CONSTRAINT "_InvitedTo_B_fkey";

-- DropTable
DROP TABLE "_InvitedTo";

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "canvasId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'view',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_canvasId_fkey" FOREIGN KEY ("canvasId") REFERENCES "Canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
