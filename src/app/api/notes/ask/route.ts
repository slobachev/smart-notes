import z from 'zod';
import { auth } from '@/lib/auth';
import {
  answerQuestionFromNotes,
  createEmbedding,
  embeddingToPgVectorLiteral,
  streamRagAnswer,
} from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import {
  consumeUserRateLimit,
  rateLimitHeaders,
  tooManyRequestsResponse,
} from '@/lib/rate-limit';

const bodySchema = z.object({
  question: z.string().min(1).max(2000),
});

const SIMILARITY_THRESHOLD = 0.8;

type Row = {
  id: string;
  title: string;
  content: string;
};

function ndjsonLine(obj: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(obj)}\n`);
}

const NO_CONTEXT_MESSAGE =
  'There is no suitable context in your notes yet (or the notes do not have embeddings). Add some text or save the note again.';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rl = await consumeUserRateLimit(session.user.id, 'ask');
  if (!rl.allowed) {
    return tooManyRequestsResponse(rl.retryAfterSec);
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
  const sources = rows.map((r) => ({ id: r.id, title: r.title }));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(
        ndjsonLine({
          type: 'meta',
          sources,
          citedNoteIds: rows.map((r) => r.id),
        })
      );
      if (rows.length === 0) {
        controller.enqueue(
          ndjsonLine({ type: 'delta', text: NO_CONTEXT_MESSAGE })
        );
        controller.enqueue(ndjsonLine({ type: 'done' }));
        controller.close();
        return;
      }
      try {
        const llmStream = await streamRagAnswer(question, rows);
        for await (const chunk of llmStream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) controller.enqueue(ndjsonLine({ type: 'delta', text }));
        }
        controller.enqueue(ndjsonLine({ type: 'done' }));
      } catch (e) {
        console.error('Ask: LLM stream failed', e);
        controller.enqueue(
          ndjsonLine({ type: 'error', message: 'Failed to generate answer' })
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      ...rateLimitHeaders(rl),
    },
  });
}
