/*
  Warnings:

  - You are about to drop the column `image_url` on the `Option` table. All the data in the column will be lost.
  - You are about to drop the column `option_id` on the `Option` table. All the data in the column will be lost.
  - Added the required column `beat_url` to the `Option` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Option" DROP COLUMN "image_url",
DROP COLUMN "option_id",
ADD COLUMN     "beat_url" TEXT NOT NULL;
