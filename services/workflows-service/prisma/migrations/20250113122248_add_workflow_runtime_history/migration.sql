CREATE TABLE "WorkflowRunTimeHistory" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "workflowRunTimeId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSON,
    "note" TEXT NOT NULL
);
