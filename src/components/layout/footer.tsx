export function Footer() {
  return (
    <footer className="hidden border-t md:block">
      <div className="container flex h-10 items-center justify-between text-xs text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} Readmigo</span>
        <div className="flex items-center gap-4">
          <a
            href="https://readmigo.app/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            隐私政策
          </a>
          <a
            href="https://readmigo.app/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            服务条款
          </a>
          <a
            href="https://readmigo.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            官网
          </a>
        </div>
      </div>
    </footer>
  );
}
