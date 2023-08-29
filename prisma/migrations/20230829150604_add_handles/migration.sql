-- CreateTable
CREATE TABLE "NodeHandle" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "NodeHandle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NodeHandle" ADD CONSTRAINT "NodeHandle_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;
