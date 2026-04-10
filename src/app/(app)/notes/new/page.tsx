'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BackToNotesLink } from '../BackToNotesLink';
import { NewNoteFormCard } from './NewNoteFormCard';

export default function NewNotePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.SubmitEvent) => {
      e.preventDefault();
      setFieldErrors({});
      setLoading(true);
      try {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        });
        const data = (await res.json()) as {
          id?: string;
          error?: Record<string, string[]>;
        };
        if (!res.ok) {
          setFieldErrors(data.error ?? { _: ['Creation error'] });
          return;
        }
        if (data.id) {
          router.push(`/notes/${data.id}`);
          router.refresh();
        }
      } catch {
        setFieldErrors({ _: ['An error occurred'] });
      } finally {
        setLoading(false);
      }
    },
    [title, content, router]
  );

  return (
    <div>
      <BackToNotesLink />
      <NewNoteFormCard
        title={title}
        content={content}
        onTitleChange={setTitle}
        onContentChange={setContent}
        onSubmit={handleSubmit}
        loading={loading}
        fieldErrors={fieldErrors}
      />
    </div>
  );
}
