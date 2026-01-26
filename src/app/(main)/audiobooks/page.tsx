import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '有声书',
  description: '探索免费英文原版有声书',
};

export default function AudiobooksPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">有声书</h1>
        <p className="text-muted-foreground">
          有声书功能即将推出
        </p>
      </div>
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg">敬请期待</p>
        <p className="mt-2 text-sm text-muted-foreground">
          我们正在努力为您准备精彩的有声书内容
        </p>
      </div>
    </div>
  );
}
