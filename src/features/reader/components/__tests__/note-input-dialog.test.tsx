import { render, screen, fireEvent } from '@testing-library/react';
import { NoteInputDialog } from '../note-input-dialog';

describe('NoteInputDialog', () => {
  it('不显示时不渲染内容', () => {
    render(
      <NoteInputDialog open={false} selectedText="test" onSave={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.queryByPlaceholderText(/写下你的想法/i)).not.toBeInTheDocument();
  });

  it('显示时渲染选中文字预览', () => {
    render(
      <NoteInputDialog open={true} selectedText="这是选中的文字" onSave={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByText('这是选中的文字')).toBeInTheDocument();
  });

  it('输入笔记后点击保存调用 onSave', () => {
    const onSave = vi.fn();
    render(
      <NoteInputDialog open={true} selectedText="text" onSave={onSave} onClose={vi.fn()} />
    );
    fireEvent.change(screen.getByPlaceholderText(/写下你的想法/i), {
      target: { value: '我的笔记' },
    });
    fireEvent.click(screen.getByRole('button', { name: /保存/i }));
    expect(onSave).toHaveBeenCalledWith('我的笔记');
  });

  it('笔记为空时保存按钮禁用', () => {
    render(
      <NoteInputDialog open={true} selectedText="text" onSave={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /保存/i })).toBeDisabled();
  });

  it('点击取消调用 onClose', () => {
    const onClose = vi.fn();
    render(
      <NoteInputDialog open={true} selectedText="text" onSave={vi.fn()} onClose={onClose} />
    );
    fireEvent.click(screen.getByRole('button', { name: /取消/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
