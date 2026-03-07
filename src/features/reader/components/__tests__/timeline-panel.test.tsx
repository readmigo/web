import { render, screen, fireEvent } from '@testing-library/react';
import { TimelinePanel } from '../timeline-panel';

const mockTocItems = [
  { id: 'ch1', href: 'chapter1.xhtml', label: 'Chapter 1' },
  { id: 'ch2', href: 'chapter2.xhtml', label: 'Chapter 2' },
  { id: 'ch3', href: 'chapter3.xhtml', label: 'Chapter 3' },
];

describe('TimelinePanel', () => {
  it('渲染所有章节', () => {
    render(
      <TimelinePanel
        items={mockTocItems}
        currentChapter={1}
        totalProgress={0.4}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    expect(screen.getByText('Chapter 2')).toBeInTheDocument();
    expect(screen.getByText('Chapter 3')).toBeInTheDocument();
  });

  it('当前章节有高亮标记', () => {
    render(
      <TimelinePanel
        items={mockTocItems}
        currentChapter={1}
        totalProgress={0.4}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const activeItem = screen.getByText('Chapter 2').closest('[data-active="true"]');
    expect(activeItem).toBeInTheDocument();
  });

  it('点击章节触发 onSelect', () => {
    const onSelect = vi.fn();
    render(
      <TimelinePanel
        items={mockTocItems}
        currentChapter={0}
        totalProgress={0.1}
        onSelect={onSelect}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Chapter 2'));
    expect(onSelect).toHaveBeenCalledWith('chapter2.xhtml');
  });

  it('已完成的章节显示 100%', () => {
    // currentChapter=2, so chapter at index 0 and 1 are past → 100%
    render(
      <TimelinePanel
        items={mockTocItems}
        currentChapter={2}
        totalProgress={0.9}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const hundredPercentBadges = screen.getAllByText('100%');
    // indices 0 and 1 are past chapters
    expect(hundredPercentBadges).toHaveLength(2);
  });

  it('当前章节显示阅读进度百分比', () => {
    // 3 chapters, currentChapter=1, totalProgress=0.6
    // progressInChapter = round(max(0, min(100, (0.6*3 - 1)*100))) = round(80) = 80
    // overall bar shows 60%, so 80% is unique in the document
    render(
      <TimelinePanel
        items={mockTocItems}
        currentChapter={1}
        totalProgress={0.6}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('80%')).toBeInTheDocument();
  });
});
