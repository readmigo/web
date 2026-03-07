import { render, screen } from '@testing-library/react';
import { TranslationSheet } from '../translation-sheet';

// Mock apiClient
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({ translation: '你好世界' }),
  },
}));

describe('TranslationSheet', () => {
  it('不显示时不渲染', () => {
    render(
      <TranslationSheet
        open={false}
        originalText="Hello world"
        bookId="b1"
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByText('Hello world')).not.toBeInTheDocument();
  });

  it('显示时渲染原文和"翻译"标题', () => {
    render(
      <TranslationSheet
        open={true}
        originalText="Hello world"
        bookId="b1"
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('翻译')).toBeInTheDocument();
  });

  it('显示时显示 loading 状态', () => {
    render(
      <TranslationSheet
        open={true}
        originalText="Hello world"
        bookId="b1"
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('翻译中...')).toBeInTheDocument();
  });
});
