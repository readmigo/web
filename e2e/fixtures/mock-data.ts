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
  <h2>I</h2>
  <p>In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since. "Whenever you feel like criticizing anyone," he told me, "just remember that all the people in this world haven't had the advantages that you've had."</p>
  <p>He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I'm inclined to reserve all judgments, a habit that has opened up many curious natures to me.</p>
  <hr/>
  <p>The practical thing was to find rooms in the city. It was a warm season and I had just left a country of wide lawns and friendly trees, so when a young man at the office suggested that we take a house together in a commuting town, it sounded like a great idea.</p>
  <p>And so it happened that on a warm windy evening I drove over to East Egg to see two old friends whom I scarcely knew at all. Their house was even more elaborate than I expected.</p>
  <p class="continued">The lawn started at the beach and ran toward the front door for a quarter of a mile, jumping over sun-dials and brick walks and burning gardens.</p>
  <p>Finally I came to <b>Gatsby</b>'s gorgeous mansion. It was a factual imitation of some Hotel de Ville in Normandy, with a tower on one side, spanking new under a thin beard of raw ivy.</p>
  <div class="epigraph">
    <p>Then wear the gold hat, if that will move her;</p>
    <p>If you can bounce high, bounce for her too,</p>
    <p>Till she cry "Lover, gold-hatted, high-bouncing lover, I must have you!"</p>
    <cite>Thomas Parke d'Invilliers</cite>
  </div>
  <div class="dedication">
    <p>Once Again to <b>Zelda</b></p>
  </div>
  <blockquote class="verse">
    <p>
      <span>In the real dark night of the soul</span>
      <span class="i1">it is always three o'clock</span>
      <span class="i2">in the morning,</span>
      <span class="i1">day after day.</span>
    </p>
  </blockquote>
  <p>There was something gorgeous about him, some heightened sensitivity to the promises of life, as if he were related to one of those intricate machines that register earthquakes ten thousand miles away.</p>
  <p>This responsiveness had nothing to do with that flabby impressionability which is dignified under the name of the "creative temperament" — it was an extraordinary gift for hope, a romantic readiness such as I have never found in any other person.</p>
  <p>No — Gatsby turned out all right at the end; it is what preyed on Gatsby, what foul dust floated in the wake of his dreams that temporarily closed out my interest in the abortive sorrows and short-winded elations of men.</p>
</body>
</html>
`;

// SE-specific HTML for typography testing
export const MOCK_SE_CHAPTER_HTML = MOCK_CHAPTER_HTML;
