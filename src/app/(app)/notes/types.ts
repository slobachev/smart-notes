export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  summary?: string | null;
  tags?: string[];
};

export type NoteSource = { id: string; title: string };
