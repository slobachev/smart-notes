import { auth } from '@/lib/auth';
import { createEmbedding, embeddingToPgVectorLiteral } from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import {
  consumeUserRateLimit,
  rateLimitHeaders,
  tooManyRequestsResponse,
} from '@/lib/rate-limit';

const SIMILARITY_THRESHOLD = 0.8;

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
  const rl = await consumeUserRateLimit(session.user.id, 'search');
  if (!rl.allowed) {
    return tooManyRequestsResponse(rl.retryAfterSec);
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
        SELECT id, title, content, summary, tags, "userId", "createdAt", "updatedAt",
        embedding <=> $2::vector(1536) AS similarity
        FROM "Note"
        WHERE "userId" = $1 
        AND embedding IS NOT NULL
        AND (embedding <=> $2::vector(1536)) < $3
        ORDER BY similarity
        LIMIT 20
        `,
    session.user.id,
    literal,
    SIMILARITY_THRESHOLD
  );
  return NextResponse.json(rows, { headers: rateLimitHeaders(rl) });
}
