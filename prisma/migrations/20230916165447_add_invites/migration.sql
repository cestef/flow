-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "canvasId" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "code" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'view',
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invite_code_key" ON "Invite"("code");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_canvasId_fkey" FOREIGN KEY ("canvasId") REFERENCES "canvases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
