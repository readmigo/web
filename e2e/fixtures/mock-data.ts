export const TEST_BOOK_ID = 'test-book-001';

export const MOCK_BOOK_DETAIL = {
  id: TEST_BOOK_ID,
  title: 'Test Book',
  author: 'Test Author',
  coverUrl: '',
  description: 'A test book for E2E testing',
  language: 'en',
  category: 'fiction',
  wordCount: 5000,
  epubUrl: '',
  estimatedReadTime: 30,
  tags: [],
  chapters: [
    { id: 'ch-1', title: 'Chapter 1', href: 'ch-1', order: 1, wordCount: 500 },
  ],
};

export const MOCK_CHAPTER_CONTENT = {
  id: 'ch-1',
  title: 'Chapter 1',
  order: 1,
  contentUrl: 'https://cdn.readmigo.app/test/chapters/ch-1.html',
  wordCount: 500,
  previousChapterId: null,
  nextChapterId: null,
};

// HTML content with multiple paragraphs for testing typography settings
export const MOCK_CHAPTER_HTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <h1>Chapter 1</h1>
  <p>The quick brown fox jumps over the lazy dog. This is a test paragraph with enough text to demonstrate various typography settings like letter spacing, word spacing, and text alignment.</p>
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
  <p>A third paragraph to ensure we have enough content for pagination and column layout testing. The content should span multiple lines to properly verify line height and paragraph spacing settings.</p>
  <p>Final paragraph with some additional text to make the content longer. This helps verify that multi-column layouts work correctly with enough content to fill the columns.</p>
</body>
</html>
`;
