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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  summary?: string | null;
  tags?: string[];
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [semanticResults, setSemanticResults] = useState<Note[] | null>(null);
  const [askQuestion, setAskQuestion] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askAnswer, setAskAnswer] = useState('');
  const [askSources, setAskSources] = useState<{ id: string; title: string }[]>(
    []
  );

  const isSearchMode = semanticResults !== null;
  const list = isSearchMode ? semanticResults : notes;

  async function runSemanticSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setError('');
    try {
      const res = await fetch(`/api/notes/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSemanticResults(data);
    } catch {
      setError('Semantic search failed');
    } finally {
      setSearching(false);
    }
  }

  async function handleAsk() {
    setAskLoading(true);
    setAskAnswer('');
    setAskSources([]);
    try {
      const res = await fetch('/api/notes/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: askQuestion.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setAskAnswer(data.answer ?? '');
      setAskSources(data.sources ?? []);
    } catch {
      setError('Could not get answer');
    } finally {
      setAskLoading(false);
    }
  }

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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Search by meaning…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void runSemanticSearch();
            }}
            className="max-w-md"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={searching}
              onClick={() => void runSemanticSearch()}
            >
              {searching ? 'Searching…' : 'Semantic search'}
            </Button>
            {semanticResults !== null && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSemanticResults(null);
                  setSearchQuery('');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        <Button asChild>
          <Link href="/notes/new">New Note</Link>
        </Button>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Ask your notes</CardTitle>
          <CardDescription>
            The answer is built only on the content of your notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            placeholder="For example: what did I write about my vacation?"
            value={askQuestion}
            onChange={(e) => setAskQuestion(e.target.value)}
            rows={3}
          />
          <Button
            type="button"
            disabled={askLoading || !askQuestion.trim()}
            onClick={handleAsk}
          >
            {askLoading ? 'Thinking…' : 'Ask'}
          </Button>
          {askAnswer && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
              {askAnswer}
            </div>
          )}
          {askSources.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Context from:{' '}
              {askSources.map((s, i) => (
                <span key={s.id}>
                  {i > 0 ? ', ' : ''}
                  <Link href={`/notes/${s.id}`} className="underline">
                    {s.title}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </CardContent>
      </Card>
      {list.length === 0 ? (
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
          {list.map((note) => (
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
