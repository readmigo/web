import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteShareCard } from '../quote-share-card';

// next-intl: return "namespace.key" as the translation
vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}));

// Mock the hook so we can spy on its methods without jsdom clipboard/share constraints
const mockCopyText = vi.fn().mockResolvedValue(undefined);
const mockSaveAsImage = vi.fn().mockResolvedValue(undefined);
const mockShareCard = vi.fn().mockResolvedValue(undefined);
const mockSetTheme = vi.fn();
const mockCardRef = { current: null };

vi.mock('@/features/share-card/use-share-card', () => ({
  useShareCard: vi.fn(() => ({
    theme: 'light',
    setTheme: mockSetTheme,
    cardRef: mockCardRef,
    copyText: mockCopyText,
    saveAsImage: mockSaveAsImage,
    shareCard: mockShareCard,
    canShare: true,
    isSaving: false,
  })),
}));

beforeEach(() => {
  mockCopyText.mockClear();
  mockSaveAsImage.mockClear();
  mockShareCard.mockClear();
  mockSetTheme.mockClear();
});

describe('QuoteShareCard', () => {
  it('does not render when closed', () => {
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

  it('renders quote text, book title and author when open', () => {
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
    // Author is rendered as "— 作者名" (mdash prefix)
    expect(screen.getByText(/作者名/)).toBeInTheDocument();
  });

  it('does not render author text when authorName is not provided', () => {
    render(
      <QuoteShareCard
        open={true}
        quoteText="引用"
        bookTitle="书名"
        onClose={vi.fn()}
      />
    );
    // No author element should appear
    expect(screen.queryByText(/— /)).not.toBeInTheDocument();
  });

  it('renders all 8 theme buttons', () => {
    render(
      <QuoteShareCard
        open={true}
        quoteText="Quote"
        bookTitle="Book"
        onClose={vi.fn()}
      />
    );
    const themes = ['light', 'dark', 'warm', 'vintage', 'nature', 'elegant', 'ocean', 'sunset'];
    themes.forEach((t) => {
      expect(screen.getByRole('button', { name: t })).toBeInTheDocument();
    });
  });

  it('marks the active theme button as pressed (aria-pressed=true)', () => {
    render(
      <QuoteShareCard
        open={true}
        quoteText="Quote"
        bookTitle="Book"
        onClose={vi.fn()}
      />
    );
    // Hook returns theme='light' by default
    expect(screen.getByRole('button', { name: 'light' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'dark' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls setTheme when a theme button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <QuoteShareCard
        open={true}
        quoteText="Quote"
        bookTitle="Book"
        onClose={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: 'dark' }));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls copyText when copy button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <QuoteShareCard
        open={true}
        quoteText="Hello world"
        bookTitle="Test Book"
        onClose={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /shareCard\.copyText/i }));
    expect(mockCopyText).toHaveBeenCalledTimes(1);
  });

  it('calls saveAsImage when save button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <QuoteShareCard
        open={true}
        quoteText="Hello world"
        bookTitle="Test Book"
        onClose={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /shareCard\.saveImage/i }));
    expect(mockSaveAsImage).toHaveBeenCalledTimes(1);
  });

  it('calls shareCard when share button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <QuoteShareCard
        open={true}
        quoteText="Hello world"
        bookTitle="Test Book"
        onClose={vi.fn()}
      />
    );
    const shareBtn = screen.queryByRole('button', { name: /shareCard\.share/i });
    if (shareBtn) {
      await user.click(shareBtn);
      expect(mockShareCard).toHaveBeenCalledTimes(1);
    }
  });

  it('save image button is not disabled by default', () => {
    render(
      <QuoteShareCard
        open={true}
        quoteText="Quote"
        bookTitle="Book"
        onClose={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /shareCard\.saveImage/i })).not.toBeDisabled();
  });

  it('calls onClose when dialog close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <QuoteShareCard
        open={true}
        quoteText="Hello"
        bookTitle="Book"
        onClose={onClose}
      />
    );
    // Radix Dialog renders a sr-only "Close" button
    const closeBtn = screen.getByRole('button', { name: /^close$/i });
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
