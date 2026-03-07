import { render, screen, fireEvent } from '@testing-library/react';
import { BookmarkSidebar } from '../bookmark-sidebar';
import { useReaderStore } from '../../stores/reader-store';

vi.mock('../../stores/reader-store', () => ({
  useReaderStore: vi.fn(),
}));

const mockStore = {
  bookmarks: [
    { id: 'bm-1', bookId: 'book-123', cfi: 'ch:0:pg:5', title: '第 1 章', createdAt: new Date('2026-01-01') },
    { id: 'bm-2', bookId: 'book-123', cfi: 'ch:2:pg:3', title: '第 3 章', createdAt: new Date('2026-01-02') },
    { id: 'bm-other', bookId: 'other-book', cfi: 'ch:0:pg:1', title: '其他书', createdAt: new Date('2026-01-03') },
  ],
  removeBookmark: vi.fn(),
};

beforeEach(() => {
  vi.mocked(useReaderStore).mockReturnValue(mockStore as any);
});

describe('BookmarkSidebar', () => {
  it('只显示当前书籍的书签', () => {
    render(<BookmarkSidebar bookId="book-123" onNavigateToBookmark={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /书签/i }));
    expect(screen.getByText('第 1 章')).toBeInTheDocument();
    expect(screen.getByText('第 3 章')).toBeInTheDocument();
    expect(screen.queryByText('其他书')).not.toBeInTheDocument();
  });

  it('书签数量徽章显示正确数量', () => {
    render(<BookmarkSidebar bookId="book-123" onNavigateToBookmark={vi.fn()} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('点击书签触发 onNavigateToBookmark', () => {
    const onNavigate = vi.fn();
    render(<BookmarkSidebar bookId="book-123" onNavigateToBookmark={onNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: /书签/i }));
    fireEvent.click(screen.getByText('第 1 章'));
    expect(onNavigate).toHaveBeenCalledWith('ch:0:pg:5');
  });

  it('点击删除按钮调用 removeBookmark 且不触发导航', () => {
    const onNavigate = vi.fn();
    const removeBookmark = vi.fn();
    vi.mocked(useReaderStore).mockReturnValue({
      ...mockStore,
      removeBookmark,
    } as any);

    render(<BookmarkSidebar bookId="book-123" onNavigateToBookmark={onNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: /书签/i }));

    // Find the row containing "第 1 章" and click its delete button
    const bookmark1Title = screen.getByText('第 1 章');
    const bookmark1Row = bookmark1Title.closest('div[class*="flex items-center justify-between"]') as HTMLElement;
    const deleteButton = bookmark1Row.querySelector('button') as HTMLElement;
    fireEvent.click(deleteButton);

    expect(removeBookmark).toHaveBeenCalledWith('bm-1', 'book-123');
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
