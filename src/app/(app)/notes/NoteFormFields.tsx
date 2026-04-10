'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type NoteFormFieldsProps = {
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  contentRows?: number;
  placeholders?: {
    title?: string;
    content?: string;
  };
  /** API validation errors per field (optional inline messages). */
  fieldErrors?: Record<string, string[]>;
};

export function NoteFormFields({
  title,
  content,
  onTitleChange,
  onContentChange,
  contentRows = 10,
  placeholders = {},
  fieldErrors,
}: NoteFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
          placeholder={placeholders.title}
        />
        {fieldErrors?.title?.map((msg) => (
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
          onChange={(e) => onContentChange(e.target.value)}
          rows={contentRows}
          placeholder={placeholders.content}
        />
        {fieldErrors?.content?.map((msg) => (
          <p key={msg} className="text-sm text-destructive">
            {msg}
          </p>
        ))}
      </div>
    </>
  );
}
