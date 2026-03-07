import { render, screen, fireEvent } from '@testing-library/react';
import { ReaderGuideOverlay } from '../reader-guide-overlay';

describe('ReaderGuideOverlay', () => {
  it('显示第一步引导内容', () => {
    render(<ReaderGuideOverlay onComplete={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/点击中央区域/i)).toBeInTheDocument();
  });

  it('点击"下一步"进入第二步', () => {
    render(<ReaderGuideOverlay onComplete={vi.fn()} onSkip={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));
    expect(screen.getByText(/左右点击/i)).toBeInTheDocument();
  });

  it('最后一步点击"开始阅读"触发 onComplete', () => {
    const onComplete = vi.fn();
    render(<ReaderGuideOverlay onComplete={onComplete} onSkip={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));
    fireEvent.click(screen.getByRole('button', { name: /下一步/i }));
    fireEvent.click(screen.getByRole('button', { name: /开始阅读/i }));
    expect(onComplete).toHaveBeenCalled();
  });

  it('点击"跳过"触发 onSkip', () => {
    const onSkip = vi.fn();
    render(<ReaderGuideOverlay onComplete={vi.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: /跳过/i }));
    expect(onSkip).toHaveBeenCalled();
  });
});
