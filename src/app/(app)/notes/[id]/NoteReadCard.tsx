'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Note } from '../types';

type NoteReadCardProps = {
  note: Note;
  summarizing: boolean;
  onSummarize: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function formatUpdatedAt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NoteReadCard({
  note,
  summarizing,
  onSummarize,
  onEdit,
  onDelete,
}: NoteReadCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{note.title}</CardTitle>
            <CardDescription className="mt-2">
              Updated: {formatUpdatedAt(note.updatedAt)}
            </CardDescription>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={summarizing}
              onClick={onSummarize}
            >
              {summarizing ? 'Summarizing…' : 'Summarize'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              Delete
            </Button>
          </div>
        </div>
        {note.summary ? (
          <CardDescription className="mt-2">
            Summary: {note.summary}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-card-foreground">
          {note.content || 'No text'}
        </p>
        {note.tags && note.tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {note.tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
