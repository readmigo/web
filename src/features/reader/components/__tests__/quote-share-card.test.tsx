import { render, screen } from '@testing-library/react';
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
});
