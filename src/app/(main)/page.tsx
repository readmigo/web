import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Brain,
  Headphones,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const features = [
  {
    icon: BookOpen,
    title: '海量原版书籍',
    description: '超过 100,000 本免费英文原版书籍，涵盖经典文学、历史、科学等领域',
  },
  {
    icon: Sparkles,
    title: 'AI 智能助手',
    description: '点击任意单词或句子，AI 为你解释含义、分析语法、提供例句',
  },
  {
    icon: Brain,
    title: '科学记忆系统',
    description: '基于 SM-2 间隔重复算法，帮你高效记忆生词',
  },
  {
    icon: Headphones,
    title: '有声书同步',
    description: 'Whispersync 技术，边听边读，提升听力和阅读能力',
  },
];

const sampleBooks = [
  {
    id: '1',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    cover: '/covers/pride-and-prejudice.jpg',
    difficulty: 'Intermediate',
  },
  {
    id: '2',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    cover: '/covers/gatsby.jpg',
    difficulty: 'Intermediate',
  },
  {
    id: '3',
    title: '1984',
    author: 'George Orwell',
    cover: '/covers/1984.jpg',
    difficulty: 'Advanced',
  },
  {
    id: '4',
    title: 'Jane Eyre',
    author: 'Charlotte Brontë',
    cover: '/covers/jane-eyre.jpg',
    difficulty: 'Intermediate',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background py-20 md:py-32">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4" variant="secondary">
              免费开始阅读
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              在故事中
              <span className="text-primary">学英语</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              通过阅读英文原版书籍，沉浸式学习语言。AI
              助手随时解答疑惑，科学记忆系统帮你高效掌握生词。
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/explore">
                  开始探索
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">了解更多</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              为什么选择 Readmigo
            </h2>
            <p className="mt-4 text-muted-foreground">
              我们提供完整的英语阅读学习体验
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-none">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Books Preview Section */}
      <section className="bg-muted/50 py-20">
        <div className="container">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">热门书籍</h2>
              <p className="mt-2 text-muted-foreground">
                发现适合你英语水平的经典著作
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/explore">
                查看全部
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
            {sampleBooks.map((book) => (
              <Link key={book.id} href={`/book/${book.id}`}>
                <Card className="overflow-hidden transition-all hover:shadow-lg">
                  <CardContent className="p-0">
                    <div className="relative aspect-[2/3] bg-muted">
                      <div className="flex h-full items-center justify-center">
                        <span className="text-4xl">📚</span>
                      </div>
                      <Badge className="absolute left-2 top-2 bg-blue-500">
                        {book.difficulty}
                      </Badge>
                    </div>
                    <div className="p-3">
                      <h3 className="line-clamp-1 font-medium">{book.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {book.author}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold">开始你的英语阅读之旅</h2>
            <p className="mt-4 text-primary-foreground/80">
              免费注册，立即访问超过 100,000 本原版英文书籍
            </p>
            <Button size="lg" variant="secondary" className="mt-8" asChild>
              <Link href="/auth/register">免费注册</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
