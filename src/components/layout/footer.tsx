import Link from 'next/link';

export function Footer() {
  return (
    <footer className="hidden border-t md:block">
      <div className="container flex h-10 items-center justify-between text-xs text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} Readmigo</span>
        <div className="flex items-center gap-4">
          <Link href="/legal/privacy" className="hover:text-foreground">
            隐私政策
          </Link>
          <Link href="/legal/terms" className="hover:text-foreground">
            服务条款
          </Link>
          <Link
            href="https://readmigo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            官网
          </Link>
        </div>
      </div>
    </footer>
  );
}
