import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect('/notes');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <main className="flex max-w-md flex-col items-center gap-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Smart Notes</h1>
        <p className="text-muted-foreground">
          Notes with search and AI suggestions. Log in or register to get
          started.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
