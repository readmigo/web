import type { ReaderSettings } from '../types';

/**
 * Generates Standard Ebook typography CSS.
 * Aligned with iOS seStandardCSS in TypesettingService.swift.
 */
export function generateSETypography(_settings: ReaderSettings): string {
  return `
/* SE Typography — Standard Ebook formatting rules */

/* First-line indent (SE default) */
p { text-indent: 1em; margin-top: 0; }
h1 + p, h2 + p, h3 + p, hr + p,
p:first-child, p.continued { text-indent: 0; }

/* Chapter headings */
h1, h2 { font-variant: small-caps; text-align: center; margin: 2em 0 1em; }

/* Scene breaks */
hr { border: none; border-top: 1px solid currentColor;
     width: 25%; margin: 1.5em auto; opacity: 0.5; }

/* SE semantic elements */
b { font-variant: small-caps; font-weight: normal; }
cite { display: block; font-variant: small-caps;
       text-align: right; margin-top: 1em; }
.dedication { font-variant: small-caps; text-align: center;
              margin: 3em auto; max-width: 80%; }
.epigraph { font-style: italic; margin: 3em auto; max-width: 40em; }
.epigraph em { font-style: normal; }

/* Poetry/verse — aligned with iOS seStandardCSS */
blockquote.verse p,
.epub-type-contains-word-z3998-poem p,
.epub-type-contains-word-z3998-song p,
.epub-type-contains-word-z3998-verse p { text-align: left; text-indent: 0; }
blockquote.verse p > span,
.epub-type-contains-word-z3998-poem p > span,
.epub-type-contains-word-z3998-song p > span,
.epub-type-contains-word-z3998-verse p > span {
  display: block; padding-left: 1em; text-indent: -1em;
}
p span.i1 { padding-left: 2em; text-indent: -1em; }
p span.i2 { padding-left: 3em; text-indent: -1em; }
p span.i3 { padding-left: 4em; text-indent: -1em; }
p span.i4 { padding-left: 5em; text-indent: -1em; }
p span.i5 { padding-left: 6em; text-indent: -1em; }
p span.i6 { padding-left: 7em; text-indent: -1em; }

/* Prevent column breaks inside block elements */
.verse, .epigraph, .dedication, figure, blockquote {
  break-inside: avoid; column-break-inside: avoid;
}

/* Cover image — fit within viewport without cropping */
img.x-ebookmaker-cover,
img[class*="cover"],
img[alt*="cover" i] {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  margin: 0 auto;
  display: block;
  column-span: all;
}

/* Hide Project Gutenberg boilerplate */
.pg-boilerplate, .pg-footer, .pgheader { display: none; }
`;
}
