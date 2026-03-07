import { render, screen, fireEvent } from '@testing-library/react';
import { SelectionBottomSheet } from '../selection-bottom-sheet';
import { useReaderStore } from '../../stores/reader-store';

vi.mock('../../stores/reader-store', () => ({
  useReaderStore: vi.fn(),
}));

const mockSelection = {
  text: '这是一段选中的文字内容',
  cfiRange: 'epubcfi(/6/4[id1]!/4/2/2,/1:0,/1:10)',
  rect: new DOMRect(100, 200, 300, 20),
};

const mockStore = {
  addHighlight: vi.fn(),
  setSelectedText: vi.fn(),
};

beforeEach(() => {
  vi.mocked(useReaderStore).mockReturnValue(mockStore as unknown as ReturnType<typeof useReaderStore>);
  mockStore.addHighlight.mockClear();
  mockStore.setSelectedText.mockClear();
});

describe('SelectionBottomSheet', () => {
  it('显示选中文字预览', () => {
    render(
      <SelectionBottomSheet selection={mockSelection} bookId="book-1" onClose={vi.fn()} />
    );
    expect(screen.getByText(/这是一段选中的文字内容/)).toBeInTheDocument();
  });

  it('显示 6 个高亮颜色按钮', () => {
    render(
      <SelectionBottomSheet selection={mockSelection} bookId="book-1" onClose={vi.fn()} />
    );
    const colorButtons = screen.getAllByRole('button', { name: /highlight-color/i });
    expect(colorButtons).toHaveLength(6);
  });

  it('点击颜色按钮调用 addHighlight', () => {
    render(
      <SelectionBottomSheet selection={mockSelection} bookId="book-1" onClose={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'highlight-color-yellow' }));
    expect(mockStore.addHighlight).toHaveBeenCalledWith(
      expect.objectContaining({ color: 'yellow', text: mockSelection.text })
    );
  });

  it('点击取消调用 onClose 并清除选中', () => {
    const onClose = vi.fn();
    render(
      <SelectionBottomSheet selection={mockSelection} bookId="book-1" onClose={onClose} />
    );
    fireEvent.click(screen.getByRole('button', { name: /取消/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
