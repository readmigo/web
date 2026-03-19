/** State snapshot returned by the paginator after each page change. */
export interface PageState {
  currentPage: number;
  totalPages: number;
  progress: number;
  isFirstPage: boolean;
  isLastPage: boolean;
}

export interface PaginatorOptions {
  margin: number;
  gap: number;
}

/** Build version marker for debugging */
const PAGINATOR_VERSION = 'v2-2026-03-19';

/**
 * CSS-column paginator that translates a content element horizontally
 * within a fixed-width container to simulate page turns.
 */
export class Paginator {
  private pageWidth: number;
  private _currentPage = 0;
  private _totalPages = 1;

  onPageChange?: (state: PageState) => void;

  constructor(
    private readonly container: HTMLElement,
    private readonly content: HTMLElement,
    private readonly options: PaginatorOptions,
  ) {
    this.pageWidth = container.clientWidth;
    console.log(`[Paginator ${PAGINATOR_VERSION}] init`, {
      containerWidth: container.clientWidth,
      containerHeight: container.clientHeight,
      contentOverflow: getComputedStyle(content).overflow,
    });
    this.recalculate();
  }

  /** Recalculate page dimensions after a layout change. */
  recalculate(): void {
    this.pageWidth = this.container.clientWidth;
    // Temporarily force overflow:hidden so scrollWidth includes all column extent
    this.content.style.setProperty('overflow', 'hidden');
    void this.content.offsetWidth; // force reflow
    const totalWidth = this.content.scrollWidth;
    this.content.style.removeProperty('overflow');
    const overflowAfter = getComputedStyle(this.content).overflow;
    this._totalPages = Math.max(
      1,
      Math.ceil(totalWidth / this.pageWidth),
    );
    this._currentPage = clamp(this._currentPage, 0, this._totalPages - 1);
    console.log(`[Paginator ${PAGINATOR_VERSION}] recalculate`, {
      pageWidth: this.pageWidth,
      scrollWidth: totalWidth,
      totalPages: this._totalPages,
      currentPage: this._currentPage,
      contentHeight: this.content.clientHeight,
      overflowAfter,
    });
  }

  get currentPage(): number {
    return this._currentPage;
  }

  get totalPages(): number {
    return this._totalPages;
  }

  get progress(): number {
    return this._totalPages <= 1 ? 1 : this._currentPage / (this._totalPages - 1);
  }

  get isFirstPage(): boolean {
    return this._currentPage === 0;
  }

  get isLastPage(): boolean {
    return this._currentPage === this._totalPages - 1;
  }

  /** Navigate to a specific page (clamped to valid range). */
  goToPage(page: number): void {
    const target = clamp(page, 0, this._totalPages - 1);
    if (target === this._currentPage) return;
    const translateX = target * this.pageWidth;
    console.log(`[Paginator ${PAGINATOR_VERSION}] goToPage`, {
      from: this._currentPage,
      to: target,
      totalPages: this._totalPages,
      translateX,
    });
    this._currentPage = target;
    this.applyTransform();
    this.onPageChange?.(this.getState());
  }

  /** Advance to the next page. Returns false if already at the last page. */
  nextPage(): boolean {
    if (this.isLastPage) {
      console.log(`[Paginator ${PAGINATOR_VERSION}] nextPage: already at last page (${this._currentPage}/${this._totalPages})`);
      return false;
    }
    this.goToPage(this._currentPage + 1);
    return true;
  }

  /** Go back to the previous page. Returns false if already at the first page. */
  prevPage(): boolean {
    if (this.isFirstPage) {
      console.log(`[Paginator ${PAGINATOR_VERSION}] prevPage: already at first page`);
      return false;
    }
    this.goToPage(this._currentPage - 1);
    return true;
  }

  goToStart(): void {
    this.goToPage(0);
  }

  goToEnd(): void {
    this.goToPage(this._totalPages - 1);
  }

  getState(): PageState {
    return {
      currentPage: this._currentPage,
      totalPages: this._totalPages,
      progress: this.progress,
      isFirstPage: this.isFirstPage,
      isLastPage: this.isLastPage,
    };
  }

  private applyTransform(): void {
    this.content.style.transform = `translateX(-${this._currentPage * this.pageWidth}px)`;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
