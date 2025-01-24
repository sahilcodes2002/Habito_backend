-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProjectInvite" ADD COLUMN     "important" BOOLEAN;
