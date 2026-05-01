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
import { Textarea } from '@/components/ui/textarea';
import type { NoteSource } from './types';

type AskNotesCardProps = {
  question: string;
  onQuestionChange: (value: string) => void;
  onAsk: () => void;
  loading: boolean;
  answer: string;
  sources: NoteSource[];
};

export function AskNotesCard({
  question,
  onQuestionChange,
  onAsk,
  loading,
  answer,
  sources,
}: AskNotesCardProps) {
  return (
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
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          rows={3}
        />
        <Button
          type="button"
          disabled={loading || !question.trim()}
          onClick={onAsk}
        >
          {loading ? 'Thinking…' : 'Ask'}
        </Button>
        {answer ? (
          <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
            {answer}
          </div>
        ) : null}
        {sources.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Context from:{' '}
            {sources.map((s, i) => (
              <span key={s.id}>
                {i > 0 ? ', ' : ''}
                <Link href={`/notes/${s.id}`} className="underline">
                  {s.title}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
