import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommentSheet } from '../comment-sheet';
import {
  useAgoraComments,
  useCreateComment,
  useDeleteComment,
  useLikeComment,
} from '../../hooks/use-agora-comments';
import { useRequireLogin } from '@/features/auth/hooks/use-require-login';
import { useMediaQuery } from '@/hooks/use-media-query';

vi.mock('../../hooks/use-agora-comments');
vi.mock('@/features/auth/hooks/use-require-login');
vi.mock('@/hooks/use-media-query');
vi.mock('@/features/auth/components/login-prompt', () => ({
  LoginPrompt: ({ onDismiss }: { feature?: string; onDismiss: () => void }) => (
    <div data-testid="login-prompt">
      <button onClick={onDismiss}>dismiss</button>
    </div>
  ),
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('@/lib/utils', () => ({
  formatRelativeTime: () => 'just now',
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

const mockComment = {
  id: 'c1',
  authorName: 'Alice',
  content: 'Great post!',
  likeCount: 3,
  isLiked: false,
  isAuthor: false,
  createdAt: new Date().toISOString(),
};

const mockAuthorComment = {
  ...mockComment,
  id: 'c2',
  isAuthor: true,
  content: 'My own comment',
};

const makeQueryResult = (overrides = {}) => ({
  data: {
    pages: [{ data: [mockComment], total: 1 }],
  },
  isLoading: false,
  error: null,
  refetch: vi.fn(),
  fetchNextPage: vi.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
  ...overrides,
});

const makeMutation = (overrides = {}) => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
  isError: false,
  error: null,
  reset: vi.fn(),
  variables: undefined,
  ...overrides,
});

beforeEach(() => {
  vi.mocked(useAgoraComments).mockReturnValue(
    makeQueryResult() as ReturnType<typeof useAgoraComments>
  );
  vi.mocked(useCreateComment).mockReturnValue(
    makeMutation() as ReturnType<typeof useCreateComment>
  );
  vi.mocked(useDeleteComment).mockReturnValue(
    makeMutation() as ReturnType<typeof useDeleteComment>
  );
  vi.mocked(useLikeComment).mockReturnValue(
    makeMutation() as ReturnType<typeof useLikeComment>
  );
  vi.mocked(useRequireLogin).mockReturnValue({
    isAuthenticated: true,
    requireLogin: () => true,
    showLoginPrompt: false,
    promptFeature: '',
    dismissPrompt: vi.fn(),
  });
  vi.mocked(useMediaQuery).mockReturnValue(false);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('CommentSheet', () => {
  it('does not render sheet when postId is null', () => {
    render(<CommentSheet postId={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders sheet when postId is provided', () => {
    render(<CommentSheet postId="post-1" onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(useAgoraComments).mockReturnValue(
      makeQueryResult({ isLoading: true, data: undefined }) as ReturnType<typeof useAgoraComments>
    );
    render(<CommentSheet postId="post-1" onClose={vi.fn()} />);
    // Loader spinner should be present (aria via animate-spin class)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state when no comments', () => {
    vi.mocked(useAgoraComments).mockReturnValue(
      makeQueryResult({
        data: { pages: [{ data: [], total: 0 }] },
      }) as ReturnType<typeof useAgoraComments>
    );
    render(<CommentSheet postId="post-1" onClose={vi.fn()} />);
    expect(screen.getByText('noComments')).toBeInTheDocument();
  });

  it('renders comment list', () => {
    render(<CommentSheet postId="post-1" onClose={vi.fn()} />);
    expect(screen.getByText('Great post!')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows comment count in header', () => {
    render(<CommentSheet postId="post-1" onClose={vi.fn()} />);
    expect(screen.getByText('(1)')).toBeInTheDocument();
  });

  it('shows post content snippet when provided', () => {
    render(
      <CommentSheet
        postId="post-1"
        postContent="The original post text"
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('The original post text')).toBeInTheDocument();
  });

  it('calls like mutation when like button is clicked', () => {
    const mutate = vi.fn();
    vi.mocked(useLikeComment).mockReturnValue(
      makeMutation({ mutate }) as ReturnType<typeof useLikeComment>
    );
    render(<CommentSheet postId="post-1" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /like/i }));
    expect(mutate).toHaveBeenCalledWith({ commentId: 'c1', isLiked: false });
  });

  it('shows login prompt when unauthenticated user tries to like', () => {
    const requireLogin = vi.fn().mockReturnValue(false);
    vi.mocked(useRequireLogin).mockReturnValue({
      isAuthenticated: false,
      requireLogin,
      showLoginPrompt: true,
      promptFeature: 'comment',
      dismissPrompt: vi.fn(),
    });
    render(<CommentSheet postId="post-1" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /like/i }));
    expect(requireLogin).toHaveBeenCalledWith('comment');
    expect(screen.getByTestId('login-prompt')).toBeInTheDocument();
  });

  it('send button is disabled when input is empty', () => {
    render(<CommentSheet postId="post-1" onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('send button is enabled when input has content', () => {
    render(<CommentSheet postId="post-1" onClose={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'A new comment' },
    });
    expect(screen.getByRole('button', { name: /send/i })).not.toBeDisabled();
  });

  it('calls createComment mutateAsync on send', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    vi.mocked(useCreateComment).mockReturnValue(
      makeMutation({ mutateAsync }) as ReturnType<typeof useCreateComment>
    );
    render(<CommentSheet postId="post-1" onClose={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'My comment' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ content: 'My comment' });
    });
  });

  it('shows delete button for own comments', () => {
    vi.mocked(useAgoraComments).mockReturnValue(
      makeQueryResult({
        data: { pages: [{ data: [mockAuthorComment], total: 1 }] },
      }) as ReturnType<typeof useAgoraComments>
    );
    render(<CommentSheet postId="post-1" onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /deleteComment/i })).toBeInTheDocument();
  });

  it('shows confirmation step before deleting', () => {
    const mutate = vi.fn();
    vi.mocked(useDeleteComment).mockReturnValue(
      makeMutation({ mutate }) as ReturnType<typeof useDeleteComment>
    );
    vi.mocked(useAgoraComments).mockReturnValue(
      makeQueryResult({
        data: { pages: [{ data: [mockAuthorComment], total: 1 }] },
      }) as ReturnType<typeof useAgoraComments>
    );
    render(<CommentSheet postId="post-1" onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /deleteComment/i }));
    expect(screen.getByText('confirmDelete')).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('calls delete mutation after confirmation', () => {
    const mutate = vi.fn();
    vi.mocked(useDeleteComment).mockReturnValue(
      makeMutation({ mutate }) as ReturnType<typeof useDeleteComment>
    );
    vi.mocked(useAgoraComments).mockReturnValue(
      makeQueryResult({
        data: { pages: [{ data: [mockAuthorComment], total: 1 }] },
      }) as ReturnType<typeof useAgoraComments>
    );
    render(<CommentSheet postId="post-1" onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /deleteComment/i }));
    fireEvent.click(screen.getByText('confirmDelete'));
    expect(mutate).toHaveBeenCalledWith('c2');
  });

  it('calls onClose when sheet is dismissed', () => {
    const onClose = vi.fn();
    render(<CommentSheet postId="post-1" onClose={onClose} />);
    // Press Escape to dismiss the Radix dialog
    fireEvent.keyDown(document, { key: 'Escape' });
    waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
