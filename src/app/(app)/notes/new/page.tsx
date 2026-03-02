'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NewNotePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError({});
    setLoading(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? { _: ['Creation error'] });
        setLoading(false);
        return;
      }
      router.push(`/notes/${data.id}`);
      router.refresh();
    } catch {
      setError({ _: ['An error occurred'] });
      setLoading(false);
    }
  }

  const flatError = Object.values(error).flat();

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/notes">← Back to list</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>New note</CardTitle>
          <CardDescription>Fill in the title and text</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Title of the note"
              />
              {error.title?.map((msg) => (
                <p key={msg} className="text-sm text-destructive">
                  {msg}
                </p>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Text</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="Text of the note..."
              />
              {error.content?.map((msg) => (
                <p key={msg} className="text-sm text-destructive">
                  {msg}
                </p>
              ))}
            </div>
            {flatError.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>{flatError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/notes">Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
