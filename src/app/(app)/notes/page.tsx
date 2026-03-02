'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch('/api/notes');
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = '/login?callbackUrl=/notes';
            return;
          }
          throw new Error('Failed to load notes');
        }
        const data = await res.json();
        setNotes(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchNotes();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Notes</h1>
        <Button asChild>
          <Link href="/notes/new">New Note</Link>
        </Button>
      </div>
      {notes.length === 0 ? (
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
      ) : (
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
                      {new Date(note.updatedAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
