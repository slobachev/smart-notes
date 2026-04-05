import { generateSummaryForNote } from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const note = await prisma.note.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }
  try {
    const summary = await generateSummaryForNote(note.title, note.content);
    const updated = await prisma.note.update({
      where: { id },
      data: { summary },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error('Summary failed', e);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
