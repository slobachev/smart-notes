'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  summary?: string | null;
  tags?: string[];
};

export default function NoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState<Record<string, string[]>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    async function fetchNote() {
      try {
        const res = await fetch(`/api/notes/${id}`);
        if (!res.ok) {
          if (res.status === 404) setError('Note not found');
          else if (res.status === 401)
            window.location.href = `/login?callbackUrl=/notes/${id}`;
          else setError('Failed to load note');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setNote(data);
        setTitle(data.title);
        setContent(data.content);
      } catch {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchNote();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!note) return;
    setFormError({});
    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? { _: ['An error occurred'] });
        setSaving(false);
        return;
      }
      setNote(data);
      setIsEditing(false);
      router.refresh();
    } catch {
      setFormError({ _: ['An error occurred'] });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this note?')) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('Failed to delete');
        return;
      }
      router.push('/notes');
      router.refresh();
    } catch {
      setError('An error occurred');
    }
  }

  async function handleSummarize() {
    setSummarizing(true);
    try {
      const res = await fetch(`/api/notes/${id}/summary`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setNote(data);
    } catch {
      setError('Could not generate summary');
    } finally {
      setSummarizing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/notes">← Back to list</Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Note not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const flatFormError = Object.values(formError).flat();

  if (isEditing) {
    return (
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/notes">← Back to list</Link>
        </Button>
        <Card>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <CardHeader>
              <CardTitle>Editing</CardTitle>
              <CardDescription>Change the title and text</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Text</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                />
              </div>
              {flatFormError.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {flatFormError.map((msg) => (
                      <span key={msg}>{msg}</span>
                    ))}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTitle(note.title);
                  setContent(note.content);
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/notes">← Back to list</Link>
      </Button>
      <Card>
        <CardHeader>
          <div className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{note.title}</CardTitle>
              <CardDescription className="mt-2">
                Updated:{' '}
                {new Date(note.updatedAt).toLocaleString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </CardDescription>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={summarizing}
                onClick={handleSummarize}
              >
                {summarizing ? 'Summarizing…' : 'Summarize'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
          {note.summary && (
            <CardDescription className="mt-2">
              Summary: {note.summary}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-card-foreground">
            {note.content || 'No text'}
          </p>
          {note.tags && note.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <span className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
