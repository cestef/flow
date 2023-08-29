-- AlterTable
ALTER TABLE "Edge" ADD COLUMN     "fromHandleId" TEXT,
ADD COLUMN     "toHandleId" TEXT;

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_fromHandleId_fkey" FOREIGN KEY ("fromHandleId") REFERENCES "NodeHandle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_toHandleId_fkey" FOREIGN KEY ("toHandleId") REFERENCES "NodeHandle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
