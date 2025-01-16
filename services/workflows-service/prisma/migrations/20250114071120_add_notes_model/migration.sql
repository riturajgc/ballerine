-- AlterTable
ALTER TABLE "WorkflowRunTimeHistory" ALTER COLUMN "timestamp" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "metadata" SET DATA TYPE JSONB;

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "workflowRunTimeId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "attachments" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "tags" TEXT[],

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);
