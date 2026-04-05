import {
  embedNoteText,
  embeddingToPgVectorLiteral,
  generateTagsForNote,
} from '@/lib/ai';
import { prisma } from '@/lib/prisma';

/**
 * Writes tags via Prisma and embedding via pgvector (raw SQL).
 * Call after create/update when title/content are known.
 */
export async function enrichNoteWithAi(
  noteId: string,
  title: string,
  content: string
): Promise<void> {
  const [tags, embedding] = await Promise.all([
    generateTagsForNote(title, content),
    embedNoteText(title, content),
  ]);

  await prisma.note.update({
    where: { id: noteId },
    data: { tags },
  });

  const literal = embeddingToPgVectorLiteral(embedding);
  await prisma.$executeRawUnsafe(
    `UPDATE "Note" SET "embedding" = $1::vector(1536) WHERE "id" = $2`,
    literal,
    noteId
  );
}
