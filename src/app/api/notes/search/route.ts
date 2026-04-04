import { NullTypes } from '@prisma/client-runtime-utils';
import { auth } from '@/lib/auth';
import { createEmbedding, embeddingToPgVectorLiteral } from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type SearchRow = {
  id: string;
  title: string;
  summary: string | null;
  tags: string[];
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();
  if (!q) {
    return NextResponse.json(
      { error: 'Missing search query' },
      { status: 400 }
    );
  }

  let literal: string;
  try {
    const qvec = await createEmbedding(q);
    literal = embeddingToPgVectorLiteral(qvec);
  } catch (e) {
    console.error('Error creating embedding', e);
    return NextResponse.json(
      { error: 'Error creating embedding' },
      { status: 500 }
    );
  }

  const rows = await prisma.$queryRawUnsafe<SearchRow[]>(
    `
        SELECT id, title, content, summary, tags, "userId", "createdAt", "updatedAt"
        FROM "Note"
        WHERE "userId" = $1 AND embedding IS NOT NULL
        ORDER BY embedding <=> $2::vector(1536)
        LIMIT 20
        `,
    session.user.id,
    literal
  );
  return NextResponse.json(rows);
}
