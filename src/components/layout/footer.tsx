import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex h-12 items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Image
            src="/icons/app-icon.png"
            alt="Readmigo"
            width={16}
            height={16}
            className="rounded-sm"
          />
          <span>&copy; {new Date().getFullYear()} Readmigo</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://readmigo.app/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            隐私政策
          </a>
          <a
            href="https://readmigo.app/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            服务条款
          </a>
          <a
            href="https://readmigo.app"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            官网
          </a>
        </div>
      </div>
    </footer>
  );
}
