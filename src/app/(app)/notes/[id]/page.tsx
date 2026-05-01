'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BackToNotesLink } from '../BackToNotesLink';
import type { Note } from '../types';
import { NoteEditCard } from './NoteEditCard';
import { NoteReadCard } from './NoteReadCard';

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
          else if (res.status === 401) {
            window.location.href = `/login?callbackUrl=/notes/${id}`;
          } else setError('Failed to load note');
          setLoading(false);
          return;
        }
        const data = (await res.json()) as Note;
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

  const handleSave = useCallback(
    async (e: React.SubmitEvent) => {
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
        const data = (await res.json()) as {
          error?: Record<string, string[]>;
        } & Note;
        if (!res.ok) {
          setFormError(data.error ?? { _: ['An error occurred'] });
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
    },
    [note, id, title, content, router]
  );

  const handleDelete = useCallback(async () => {
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
  }, [id, router]);

  const handleSummarize = useCallback(async () => {
    setSummarizing(true);
    try {
      const res = await fetch(`/api/notes/${id}/summary`, {
        method: 'POST',
      });
      const data = (await res.json()) as Note;
      if (!res.ok) throw new Error();
      setNote(data);
    } catch {
      setError('Could not generate summary');
    } finally {
      setSummarizing(false);
    }
  }, [id]);

  const handleCancelEdit = useCallback(() => {
    if (!note) return;
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(false);
  }, [note]);

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
        <BackToNotesLink className="mb-4" />
        <Alert variant="destructive">
          <AlertDescription>{error || 'Note not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        <BackToNotesLink />
        <NoteEditCard
          title={title}
          content={content}
          onTitleChange={setTitle}
          onContentChange={setContent}
          onSubmit={handleSave}
          onCancel={handleCancelEdit}
          saving={saving}
          formError={formError}
        />
      </div>
    );
  }

  return (
    <div>
      <BackToNotesLink />
      <NoteReadCard
        note={note}
        summarizing={summarizing}
        onSummarize={handleSummarize}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
      />
    </div>
  );
}
