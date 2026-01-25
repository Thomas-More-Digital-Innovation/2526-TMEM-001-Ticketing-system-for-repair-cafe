/*
  Warnings:

  - You are about to drop the column `isGebruiktTijd` on the `QRLogin` table. All the data in the column will be lost.
  - You are about to drop the column `vervalTijd` on the `QRLogin` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "QRLogin" DROP COLUMN "isGebruiktTijd",
DROP COLUMN "vervalTijd";
