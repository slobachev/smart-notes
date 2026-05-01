'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Note } from './types';

type NotesListProps = {
  notes: Note[];
};

function formatUpdatedAt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function NotesList({ notes }: NotesListProps) {
  if (notes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No notes yet</CardTitle>
          <CardDescription>
            Create your first note to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/notes/new">Create Note</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li key={note.id}>
          <Link href={`/notes/${note.id}`}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{note.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {note.content || 'No text'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  {formatUpdatedAt(note.updatedAt)}
                </p>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
