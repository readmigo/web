import Link from 'next/link';
import { BookOpen } from 'lucide-react';

const footerLinks = {
  product: [
    { name: '功能介绍', href: '/features' },
    { name: '价格', href: '/pricing' },
    { name: '下载', href: '/download' },
  ],
  resources: [
    { name: '帮助中心', href: '/support' },
    { name: '书籍目录', href: '/catalog' },
    { name: '博客', href: '/blog' },
  ],
  company: [
    { name: '关于我们', href: '/about' },
    { name: '联系我们', href: '/contact' },
    { name: '加入我们', href: '/careers' },
  ],
  legal: [
    { name: '隐私政策', href: '/legal/privacy' },
    { name: '服务条款', href: '/legal/terms' },
    { name: '开源许可', href: '/legal/licenses' },
  ],
};

export function Footer() {
  return (
    <footer className="hidden border-t bg-muted/50 md:block">
      <div className="container py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-bold">Readmigo</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              在故事中学英语
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold">产品</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">资源</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">公司</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">法律</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Readmigo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
