'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  X,
  Send,
  BookOpen,
  Languages,
  Sparkles,
  Volume2,
  Plus,
  Loader2,
} from 'lucide-react';
import { useReaderStore } from '../stores/reader-store';
import {
  useExplainWord,
  useSimplifySentence,
  useTranslate,
  useAIQA,
  type WordExplanation,
} from '../hooks/use-ai';

interface AiPanelProps {
  onClose: () => void;
  bookId?: string;
}

export function AiPanel({ onClose, bookId }: AiPanelProps) {
  const { selectedText, addHighlight } = useReaderStore();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const [wordDefinition, setWordDefinition] = useState<WordExplanation | null>(null);
  const [translation, setTranslation] = useState<string | null>(null);

  const explainMutation = useExplainWord();
  const simplifyMutation = useSimplifySentence();
  const translateMutation = useTranslate();
  const qaMutation = useAIQA();

  // Auto-explain when text is selected
  useEffect(() => {
    if (selectedText?.text) {
      const text = selectedText.text.trim();
      // If it's a single word, explain it
      if (text.split(/\s+/).length <= 3) {
        handleExplain();
      }
    }
  }, [selectedText?.text]);

  const handleExplain = async () => {
    if (!selectedText?.text) return;

    try {
      const result = await explainMutation.mutateAsync({
        word: selectedText.text.trim().split(/\s+/)[0], // First word
        sentence: selectedText.text,
        bookId,
      });
      setWordDefinition(result);
    } catch (error) {
      console.error('Failed to explain:', error);
    }
  };

  const handleTranslate = async () => {
    if (!selectedText?.text) return;

    try {
      const result = await translateMutation.mutateAsync({
        text: selectedText.text,
        targetLanguage: 'zh',
        bookId,
      });
      setTranslation(result.translation);
    } catch (error) {
      console.error('Failed to translate:', error);
    }
  };

  const handleSimplify = async () => {
    if (!selectedText?.text) return;

    try {
      const result = await simplifyMutation.mutateAsync({
        sentence: selectedText.text,
        bookId,
      });
      setChatHistory([
        ...chatHistory,
        { role: 'user', content: `简化: "${selectedText.text}"` },
        { role: 'assistant', content: result.simplified },
      ]);
    } catch (error) {
      console.error('Failed to simplify:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setChatHistory([...chatHistory, { role: 'user', content: userMessage }]);

    try {
      const result = await qaMutation.mutateAsync({
        question: userMessage,
        context: selectedText?.text || '',
        bookId,
      });
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: result.answer },
      ]);
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: '抱歉，我暂时无法回答这个问题。请稍后再试。' },
      ]);
    }
  };

  const handleAddToVocabulary = () => {
    if (wordDefinition) {
      // TODO: Implement add to vocabulary via API
      console.log('Add to vocabulary:', wordDefinition.word);
    }
  };

  const handleHighlight = (color: 'yellow' | 'green' | 'blue' | 'pink') => {
    if (selectedText) {
      addHighlight({
        bookId: bookId || '',
        cfiRange: selectedText.cfiRange,
        text: selectedText.text,
        color,
      });
    }
  };

  const handleSpeak = () => {
    if (selectedText?.text && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(selectedText.text);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const isLoading = explainMutation.isPending || translateMutation.isPending || qaMutation.isPending;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col border-l bg-background shadow-lg">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">AI 助手</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Selected Text */}
          {selectedText && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                选中的文本
              </h3>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm italic">&quot;{selectedText.text}&quot;</p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTranslate}
                  disabled={translateMutation.isPending}
                >
                  {translateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Languages className="mr-2 h-4 w-4" />
                  )}
                  翻译
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExplain}
                  disabled={explainMutation.isPending}
                >
                  {explainMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <BookOpen className="mr-2 h-4 w-4" />
                  )}
                  解释
                </Button>
                <Button size="sm" variant="outline" onClick={handleSpeak}>
                  <Volume2 className="mr-2 h-4 w-4" />
                  朗读
                </Button>
              </div>

              {/* Translation Result */}
              {translation && (
                <div className="rounded-lg bg-primary/10 p-3">
                  <p className="text-sm font-medium text-primary">{translation}</p>
                </div>
              )}

              {/* Highlight Colors */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">高亮:</span>
                <button
                  onClick={() => handleHighlight('yellow')}
                  className="h-6 w-6 rounded-full bg-yellow-300 ring-offset-background hover:ring-2 hover:ring-ring hover:ring-offset-2"
                />
                <button
                  onClick={() => handleHighlight('green')}
                  className="h-6 w-6 rounded-full bg-green-300 ring-offset-background hover:ring-2 hover:ring-ring hover:ring-offset-2"
                />
                <button
                  onClick={() => handleHighlight('blue')}
                  className="h-6 w-6 rounded-full bg-blue-300 ring-offset-background hover:ring-2 hover:ring-ring hover:ring-offset-2"
                />
                <button
                  onClick={() => handleHighlight('pink')}
                  className="h-6 w-6 rounded-full bg-pink-300 ring-offset-background hover:ring-2 hover:ring-ring hover:ring-offset-2"
                />
              </div>
            </div>
          )}

          <Separator />

          {/* Word Definition */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              单词释义
            </h3>
            {explainMutation.isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : wordDefinition ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                      {wordDefinition.word}
                    </span>
                    <Badge variant="secondary">
                      {wordDefinition.partOfSpeech}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddToVocabulary}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    加入生词本
                  </Button>
                </div>
                {wordDefinition.phonetic && (
                  <p className="text-sm text-muted-foreground">
                    {wordDefinition.phonetic}
                  </p>
                )}
                <p className="text-sm">{wordDefinition.definition}</p>
                <p className="text-sm font-medium text-primary">
                  {wordDefinition.translation}
                </p>

                {wordDefinition.examples && wordDefinition.examples.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      例句:
                    </p>
                    {wordDefinition.examples.map((example, i) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        • {example}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                选择文本后点击"解释"按钮查看释义
              </p>
            )}
          </div>

          <Separator />

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                对话历史
              </h3>
              <div className="space-y-3">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'ml-8 bg-primary text-primary-foreground'
                        : 'mr-8 bg-muted'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ))}
                {qaMutation.isPending && (
                  <div className="mr-8 rounded-lg bg-muted p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="输入问题..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={qaMutation.isPending}
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={qaMutation.isPending}
          >
            {qaMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
