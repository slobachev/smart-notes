'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NoteFormFields } from '../NoteFormFields';
import { flattenFieldErrors } from '../form-error-utils';

type NewNoteFormCardProps = {
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: (e: React.SubmitEvent) => void;
  loading: boolean;
  fieldErrors: Record<string, string[]>;
};

export function NewNoteFormCard({
  title,
  content,
  onTitleChange,
  onContentChange,
  onSubmit,
  loading,
  fieldErrors,
}: NewNoteFormCardProps) {
  const flatError = flattenFieldErrors(fieldErrors);

  return (
    <Card>
      <CardHeader>
        <CardTitle>New note</CardTitle>
        <CardDescription>Fill in the title and text</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <CardContent className="flex flex-col gap-4">
          <NoteFormFields
            title={title}
            content={content}
            onTitleChange={onTitleChange}
            onContentChange={onContentChange}
            contentRows={8}
            placeholders={{
              title: 'Title of the note',
              content: 'Text of the note...',
            }}
            fieldErrors={fieldErrors}
          />
          {flatError.length > 0 ? (
            <Alert variant="destructive">
              <AlertDescription>{flatError.join(' · ')}</AlertDescription>
            </Alert>
          ) : null}
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
  );
}
