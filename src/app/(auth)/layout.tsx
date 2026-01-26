import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-center border-b">
        <Link href="/" className="text-xl font-bold">
          Readmigo
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        {children}
      </main>
      <footer className="flex h-14 items-center justify-center border-t text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Readmigo. All rights reserved.
      </footer>
    </div>
  );
}
