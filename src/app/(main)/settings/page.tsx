import { Metadata } from 'next';
import { SettingsContent } from './settings-content';

export const metadata: Metadata = {
  title: '设置',
  description: '管理你的 Readmigo 设置',
};

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-muted-foreground">管理你的应用设置和偏好</p>
      </div>
      <SettingsContent />
    </div>
  );
}
