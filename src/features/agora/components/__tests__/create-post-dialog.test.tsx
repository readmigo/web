import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreatePostDialog } from '../create-post-dialog';
import { useCreatePost } from '../../hooks/use-create-post';
import { useRequireLogin } from '@/features/auth/hooks/use-require-login';

vi.mock('../../hooks/use-create-post');
vi.mock('@/features/auth/hooks/use-require-login');
vi.mock('@/features/auth/components/login-prompt', () => ({
  LoginPrompt: ({ onDismiss }: { feature?: string; onDismiss: () => void }) => (
    <div data-testid="login-prompt">
      <button onClick={onDismiss}>dismiss</button>
    </div>
  ),
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (key === 'charCount' && params) return `${params.count}/500`;
    return key;
  },
}));

const mockMutateAsync = vi.fn();
const mockReset = vi.fn();

beforeEach(() => {
  vi.mocked(useCreatePost).mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
    isError: false,
    error: null,
    reset: mockReset,
  } as ReturnType<typeof useCreatePost>);

  vi.mocked(useRequireLogin).mockReturnValue({
    isAuthenticated: true,
    requireLogin: () => true,
    showLoginPrompt: false,
    promptFeature: '',
    dismissPrompt: vi.fn(),
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('CreatePostDialog', () => {
  it('renders the trigger button', () => {
    render(<CreatePostDialog />);
    expect(screen.getByRole('button', { name: /createPost/i })).toBeInTheDocument();
  });

  it('opens dialog when trigger is clicked by authenticated user', async () => {
    render(<CreatePostDialog />);
    fireEvent.click(screen.getByRole('button', { name: /createPost/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('shows login prompt when unauthenticated user clicks trigger', async () => {
    const requireLogin = vi.fn().mockReturnValue(false);
    vi.mocked(useRequireLogin).mockReturnValue({
      isAuthenticated: false,
      requireLogin,
      showLoginPrompt: true,
      promptFeature: 'createPost',
      dismissPrompt: vi.fn(),
    });

    render(<CreatePostDialog />);
    fireEvent.click(screen.getByRole('button', { name: /createPost/i }));

    expect(requireLogin).toHaveBeenCalledWith('createPost');
    // Dialog should not open
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // Login prompt should be visible
    expect(screen.getByTestId('login-prompt')).toBeInTheDocument();
  });

  it('publish button is disabled when content is empty', async () => {
    render(<CreatePostDialog />);
    fireEvent.click(screen.getByRole('button', { name: /createPost/i }));
    await waitFor(() => screen.getByRole('dialog'));

    const publishBtn = screen.getByRole('button', { name: /^publish$/i });
    expect(publishBtn).toBeDisabled();
  });

  it('publish button is enabled when content is entered', async () => {
    render(<CreatePostDialog />);
    fireEvent.click(screen.getByRole('button', { name: /createPost/i }));
    await waitFor(() => screen.getByRole('dialog'));

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Hello world' },
    });

    const publishBtn = screen.getByRole('button', { name: /^publish$/i });
    expect(publishBtn).not.toBeDisabled();
  });

  it('calls mutateAsync with trimmed content on submit', async () => {
    mockMutateAsync.mockResolvedValue({});
    render(<CreatePostDialog />);
    fireEvent.click(screen.getByRole('button', { name: /createPost/i }));
    await waitFor(() => screen.getByRole('dialog'));

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '  Great book!  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^publish$/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ content: 'Great book!' });
    });
  });

  it('closes dialog and resets content after successful submit', async () => {
    mockMutateAsync.mockResolvedValue({});
    render(<CreatePostDialog />);
    fireEvent.click(screen.getByRole('button', { name: /createPost/i }));
    await waitFor(() => screen.getByRole('dialog'));

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'A great post' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^publish$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('shows error message when mutation fails', async () => {
    vi.mocked(useCreatePost).mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(new Error('Network error')),
      isPending: false,
      isError: true,
      error: new Error('Network error'),
      reset: mockReset,
    } as ReturnType<typeof useCreatePost>);

    render(<CreatePostDialog />);
    fireEvent.click(screen.getByRole('button', { name: /createPost/i }));
    await waitFor(() => screen.getByRole('dialog'));

    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('shows character count', async () => {
    render(<CreatePostDialog />);
    fireEvent.click(screen.getByRole('button', { name: /createPost/i }));
    await waitFor(() => screen.getByRole('dialog'));

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Hello' },
    });

    expect(screen.getByText('5/500')).toBeInTheDocument();
  });
});
