import z from 'zod';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const updateNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const note = await prisma.note.findUnique({
    where: { id, userId: session.user.id },
  });
  if (!note) {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }
  return NextResponse.json(note);
}

export async function PATCH(
  req: Request,
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
  const body = await req.json();
  const parsed = updateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const updated = await prisma.note.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
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
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
