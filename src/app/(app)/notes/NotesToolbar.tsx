'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type NotesToolbarProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearchSubmit: () => void;
  searching: boolean;
  hasActiveSearch: boolean;
  onClearSearch: () => void;
};

export function NotesToolbar({
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  searching,
  hasActiveSearch,
  onClearSearch,
}: NotesToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <h1 className="text-2xl font-semibold">My Notes</h1>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by meaning…"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearchSubmit();
          }}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={searching}
            onClick={onSearchSubmit}
          >
            {searching ? 'Searching…' : 'Semantic search'}
          </Button>
          {hasActiveSearch && (
            <Button type="button" variant="outline" onClick={onClearSearch}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <Button asChild className="shrink-0 self-start lg:self-auto">
        <Link href="/notes/new">New Note</Link>
      </Button>
    </div>
  );
}
