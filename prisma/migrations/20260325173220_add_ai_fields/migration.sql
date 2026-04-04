-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public";
-- AlterTable (nullable embedding: set real vector when saving a note; DEFAULT vector(1536) is invalid SQL — parsed as function call)
ALTER TABLE "Note" ADD COLUMN     "embedding" vector(1536),
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "tags" TEXT[];
