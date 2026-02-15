import { MeContent } from './me-content';

export const metadata = {
  title: '我的 - Readmigo',
  description: '个人中心与设置',
};

export default function MePage() {
  return (
    <div className="container py-6">
      <MeContent />
    </div>
  );
}
