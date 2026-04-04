import z from 'zod';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enrichNoteWithAi } from '@/lib/enrich-note-ai';

const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const notes = await prisma.note.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const note = await prisma.note.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        userId: session.user.id,
      },
    });

    try {
      await enrichNoteWithAi(note.id, note.title, note.content);
    } catch (e) {
      console.error('Error enriching note with AI', e);
    }

    const fresh = await prisma.note.findUniqueOrThrow({
      where: { id: note.id },
    });
    return NextResponse.json(fresh);
  } catch (e) {
    return NextResponse.json({ error: 'Error creating note' }, { status: 500 });
  }
}
