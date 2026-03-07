import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteShareCard } from '../quote-share-card';
import { useReaderStore } from '../../stores/reader-store';

vi.mock('../../stores/reader-store', () => ({
  useReaderStore: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(useReaderStore).mockReturnValue({
    settings: { theme: 'light' },
  } as unknown as ReturnType<typeof useReaderStore>);
});

describe('QuoteShareCard', () => {
  it('不显示时不渲染', () => {
    render(
      <QuoteShareCard
        open={false}
        quoteText="这是引用"
        bookTitle="书名"
        authorName="作者"
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByText('这是引用')).not.toBeInTheDocument();
  });

  it('显示时渲染引用文字、书名、作者', () => {
    render(
      <QuoteShareCard
        open={true}
        quoteText="这是一段引用"
        bookTitle="测试书名"
        authorName="作者名"
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('这是一段引用')).toBeInTheDocument();
    expect(screen.getByText('测试书名')).toBeInTheDocument();
    expect(screen.getByText('作者名')).toBeInTheDocument();
  });

  it('不传 authorName 时不渲染作者行', () => {
    render(
      <QuoteShareCard
        open={true}
        quoteText="引用"
        bookTitle="书名"
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByText('作者名')).not.toBeInTheDocument();
  });

  it('clicking share button calls navigator.share', async () => {
    const user = userEvent.setup();
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true });

    render(<QuoteShareCard open quoteText="Hello world" bookTitle="Test Book" onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '分享' }));
    expect(mockShare).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining('Hello world') }));
  });

  it('clicking close button calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<QuoteShareCard open quoteText="Hello" bookTitle="Book" onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: '关闭' }));
    expect(onClose).toHaveBeenCalled();
  });
});
