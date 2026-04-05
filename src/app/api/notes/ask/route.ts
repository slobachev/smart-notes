import z from 'zod';
import { auth } from '@/lib/auth';
import {
  answerQuestionFromNotes,
  createEmbedding,
  embeddingToPgVectorLiteral,
} from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const bodySchema = z.object({
  question: z.string().min(1).max(2000),
});

const SIMILARITY_THRESHOLD = 0.8;

type Row = {
  id: string;
  title: string;
  content: string;
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const question = parsed.data.question.trim();
  let literal: string;
  try {
    const vec = await createEmbedding(question);
    literal = embeddingToPgVectorLiteral(vec);
  } catch (e) {
    console.error('Ask: embed failed', e);
    return NextResponse.json(
      { error: 'Failed to embed question' },
      { status: 500 }
    );
  }

  const rows = await prisma.$queryRawUnsafe<Row[]>(
    `SELECT id, title, content, embedding <=> $2::vector(1536) AS similarity
     FROM "Note"
     WHERE "userId" = $1 
     AND embedding IS NOT NULL
     AND (embedding <=> $2::vector(1536)) < $3
     ORDER BY similarity
     LIMIT 8`,
    session.user.id,
    literal,
    SIMILARITY_THRESHOLD
  );

  try {
    const { answer, citedNoteIds } = await answerQuestionFromNotes(
      question,
      rows
    );
    return NextResponse.json({
      answer,
      citedNoteIds,
      sources: rows.map((r) => ({ id: r.id, title: r.title })),
    });
  } catch (e) {
    console.error('Ask: LLM failed', e);
    return NextResponse.json(
      { error: 'Failed to generate answer' },
      { status: 500 }
    );
  }
}
