-- AlterTable
ALTER TABLE "Node" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
