'use client';

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

type NoteEditCardProps = {
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: (e: React.SubmitEvent) => void;
  onCancel: () => void;
  saving: boolean;
  formError: Record<string, string[]>;
};

export function NoteEditCard({
  title,
  content,
  onTitleChange,
  onContentChange,
  onSubmit,
  onCancel,
  saving,
  formError,
}: NoteEditCardProps) {
  const flatFormError = flattenFieldErrors(formError);

  return (
    <Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <CardHeader>
          <CardTitle>Editing</CardTitle>
          <CardDescription>Change the title and text</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <NoteFormFields
            title={title}
            content={content}
            onTitleChange={onTitleChange}
            onContentChange={onContentChange}
            contentRows={10}
          />
          {flatFormError.length > 0 ? (
            <Alert variant="destructive">
              <AlertDescription>
                {flatFormError.map((msg) => (
                  <span key={msg}>{msg}</span>
                ))}
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
