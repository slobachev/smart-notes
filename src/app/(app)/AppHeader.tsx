'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const { data: session } = useSession();

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Button
          variant="link"
          asChild
          className="h-auto p-0 text-lg font-semibold"
        >
          <Link href="/notes">Smart Notes</Link>
        </Button>
        <div className="flex items-center gap-4">
          {session?.user?.email && (
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
