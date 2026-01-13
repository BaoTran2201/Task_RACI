/*
  Warnings:

  - You are about to drop the `Department` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Position` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `departmentId` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `positionId` on the `Employee` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Department_name_key";

-- DropIndex
DROP INDEX "Position_name_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Department";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Position";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "managerId" TEXT,
    CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Employee" ("department", "id", "managerId", "name", "position") SELECT "department", "id", "managerId", "name", "position" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "note" TEXT,
    "partner" TEXT,
    "partnerId" TEXT,
    "projectId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("createdAt", "creatorId", "frequency", "groupName", "id", "name", "note", "partner", "projectId") SELECT "createdAt", "creatorId", "frequency", "groupName", "id", "name", "note", "partner", "projectId" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_partnerId_idx" ON "Task"("partnerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Partner_normalizedName_key" ON "Partner"("normalizedName");
