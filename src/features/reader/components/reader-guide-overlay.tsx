'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

const GUIDE_STEPS = [
  {
    title: '显示控件',
    description: '点击中央区域可以显示或隐藏阅读工具栏',
    icon: '👆',
  },
  {
    title: '翻页',
    description: '左右点击屏幕两侧或按键盘方向键翻页',
    icon: '📖',
  },
  {
    title: '高亮与笔记',
    description: '长按或选中文字，可以添加高亮或笔记',
    icon: '✏️',
  },
];

interface ReaderGuideOverlayProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function ReaderGuideOverlay({ onComplete, onSkip }: ReaderGuideOverlayProps) {
  const [step, setStep] = useState(0);
  const isLast = step === GUIDE_STEPS.length - 1;
  const current = GUIDE_STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
      <div className="relative w-80 rounded-2xl bg-background p-6 shadow-2xl">
        {/* Step indicator */}
        <div className="flex justify-center gap-1.5 mb-6">
          {GUIDE_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center space-y-3 mb-6">
          <div className="text-4xl">{current.icon}</div>
          <h3 className="font-semibold text-lg">{current.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1" onClick={onSkip}>
            跳过
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setStep((s) => s + 1);
              }
            }}
          >
            {isLast ? '开始阅读' : '下一步'}
          </Button>
        </div>
      </div>
    </div>
  );
}
