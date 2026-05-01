'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AskNotesCard } from './AskNotesCard';
import { consumeAskNdjsonStream } from './consume-ask-stream';
import { NotesList } from './NotesList';
import { NotesToolbar } from './NotesToolbar';
import type { Note, NoteSource } from './types';

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
  const [askSources, setAskSources] = useState<NoteSource[]>([]);

  const displayedNotes = semanticResults ?? notes;

  const runSemanticSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setSearching(true);
    setError('');
    try {
      const res = await fetch(
        `/api/notes/search?q=${encodeURIComponent(q)}`
      );
      if (!res.ok) throw new Error('Search failed');
      const data = (await res.json()) as Note[];
      setSemanticResults(data);
    } catch {
      setError('Semantic search failed');
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleAsk = useCallback(async () => {
    setAskLoading(true);
    setAskAnswer('');
    setAskSources([]);
    setError('');

    try {
      const res = await fetch('/api/notes/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: askQuestion.trim() }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: unknown;
        };
        throw new Error(
          typeof errBody.error === 'string'
            ? errBody.error
            : 'Could not get answer'
        );
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      await consumeAskNdjsonStream(reader, {
        onMeta: setAskSources,
        onDelta: setAskAnswer,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not get answer');
    } finally {
      setAskLoading(false);
    }
  }, [askQuestion]);

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
        const data = (await res.json()) as Note[];
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
      <NotesToolbar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearchSubmit={() => void runSemanticSearch()}
        searching={searching}
        hasActiveSearch={semanticResults !== null}
        onClearSearch={() => {
          setSemanticResults(null);
          setSearchQuery('');
        }}
      />

      <AskNotesCard
        question={askQuestion}
        onQuestionChange={setAskQuestion}
        onAsk={() => void handleAsk()}
        loading={askLoading}
        answer={askAnswer}
        sources={askSources}
      />

      <NotesList notes={displayedNotes} />
    </div>
  );
}
