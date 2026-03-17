import { render, screen, fireEvent } from '@testing-library/react';
import { ImageViewer } from '../image-viewer';

// createPortal renders into document.body in the test environment
vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

const IMAGES = [
  'https://example.com/img1.jpg',
  'https://example.com/img2.jpg',
  'https://example.com/img3.jpg',
];

describe('ImageViewer', () => {
  it('renders the initial image by src', () => {
    render(<ImageViewer images={IMAGES} initialIndex={0} onClose={vi.fn()} />);
    const img = screen.getByRole('img', { name: 'Image 1' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', IMAGES[0]);
  });

  it('shows index indicator when multiple images are provided', () => {
    render(<ImageViewer images={IMAGES} initialIndex={1} onClose={vi.fn()} />);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('does not show index indicator for a single image', () => {
    render(<ImageViewer images={[IMAGES[0]]} initialIndex={0} onClose={vi.fn()} />);
    expect(screen.queryByText(/\//)).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<ImageViewer images={IMAGES} initialIndex={0} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close image viewer/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<ImageViewer images={IMAGES} initialIndex={0} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('navigates to the next image when the right arrow button is clicked', () => {
    render(<ImageViewer images={IMAGES} initialIndex={0} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /next image/i }));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', IMAGES[1]);
  });

  it('navigates to the previous image when the left arrow button is clicked', () => {
    render(<ImageViewer images={IMAGES} initialIndex={2} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /previous image/i }));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', IMAGES[1]);
  });

  it('navigates via ArrowRight keyboard key', () => {
    render(<ImageViewer images={IMAGES} initialIndex={0} onClose={vi.fn()} />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('navigates via ArrowLeft keyboard key', () => {
    render(<ImageViewer images={IMAGES} initialIndex={2} onClose={vi.fn()} />);
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('does not render a previous button on the first image', () => {
    render(<ImageViewer images={IMAGES} initialIndex={0} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /previous image/i })).not.toBeInTheDocument();
  });

  it('does not render a next button on the last image', () => {
    render(<ImageViewer images={IMAGES} initialIndex={2} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /next image/i })).not.toBeInTheDocument();
  });

  it('renders dot indicators matching the number of images', () => {
    render(<ImageViewer images={IMAGES} initialIndex={0} onClose={vi.fn()} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(IMAGES.length);
  });

  it('navigates to an image when its dot indicator is clicked', () => {
    render(<ImageViewer images={IMAGES} initialIndex={0} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: /go to image 3/i }));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', IMAGES[2]);
  });

  it('has aria-modal and role=dialog for accessibility', () => {
    render(<ImageViewer images={IMAGES} initialIndex={0} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
