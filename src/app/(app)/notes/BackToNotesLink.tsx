'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BackToNotesLinkProps = {
  className?: string;
};

export function BackToNotesLink({ className }: BackToNotesLinkProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className={cn('mb-6', className)}
    >
      <Link href="/notes">← Back to list</Link>
    </Button>
  );
}
