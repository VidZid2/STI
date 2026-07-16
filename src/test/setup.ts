import '@testing-library/jest-dom';
import { vi } from 'vitest';

// --- ResizeObserver Mock ---
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = MockResizeObserver;

// --- window.resizeTo Mock ---
window.resizeTo = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event('resize'));
};

// --- Element.scrollIntoView Mock ---
Element.prototype.scrollIntoView = vi.fn();

// --- Range Mock ---
class MockRange {
  commonAncestorContainer = null;
  startContainer = null;
  startOffset = 0;
  endContainer = null;
  endOffset = 0;
  collapsed = true;

  setStart(node: Node, offset: number) {
    this.startContainer = node;
    this.startOffset = offset;
  }

  setEnd(node: Node, offset: number) {
    this.endContainer = node;
    this.endOffset = offset;
  }

  setStartBefore = vi.fn();
  setStartAfter = vi.fn();
  setEndBefore = vi.fn();
  setEndAfter = vi.fn();
  selectNode = vi.fn();
  selectNodeContents = vi.fn();
  collapse = vi.fn();
  cloneRange() {
    const range = new MockRange();
    range.startContainer = this.startContainer;
    range.startOffset = this.startOffset;
    range.endContainer = this.endContainer;
    range.endOffset = this.endOffset;
    range.collapsed = this.collapsed;
    return range;
  }
  detach = vi.fn();
  getBoundingClientRect() {
    return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0 };
  }
  getClientRects() {
    return [] as unknown as DOMRectList;
  }
  createContextualFragment(html: string) {
    const fragment = document.createDocumentFragment();
    const div = document.createElement('div');
    div.innerHTML = html;
    while (div.firstChild) {
      fragment.appendChild(div.firstChild);
    }
    return fragment;
  }
}

// Make Range globally available if it isn't
if (!window.Range) {
  (window as any).Range = MockRange;
}

const originalCreateRange = document.createRange;
document.createRange = () => {
  return new MockRange() as unknown as Range;
};

// --- Selection Mock ---
class MockSelection {
  anchorNode: Node | null = null;
  anchorOffset = 0;
  focusNode: Node | null = null;
  focusOffset = 0;
  isCollapsed = true;
  rangeCount = 0;
  type = 'None';
  private ranges: Range[] = [];

  getRangeAt(index: number) {
    if (index >= this.ranges.length) {
      throw new Error('IndexSizeError');
    }
    return this.ranges[index];
  }

  addRange(range: Range) {
    this.ranges.push(range);
    this.rangeCount = this.ranges.length;
    this.anchorNode = range.startContainer;
    this.anchorOffset = range.startOffset;
    this.focusNode = range.endContainer;
    this.focusOffset = range.endOffset;
    this.isCollapsed = range.collapsed;
    this.type = range.collapsed ? 'Caret' : 'Range';
  }

  removeAllRanges() {
    this.ranges = [];
    this.rangeCount = 0;
    this.anchorNode = null;
    this.anchorOffset = 0;
    this.focusNode = null;
    this.focusOffset = 0;
    this.isCollapsed = true;
    this.type = 'None';
  }

  empty() {
    this.removeAllRanges();
  }

  collapse(node: Node | null, offset = 0) {
    this.anchorNode = node;
    this.anchorOffset = offset;
    this.focusNode = node;
    this.focusOffset = offset;
    this.isCollapsed = true;
    this.type = 'Caret';
    const range = document.createRange();
    if (node) {
      range.setStart(node, offset);
      range.setEnd(node, offset);
    }
    this.ranges = [range];
    this.rangeCount = 1;
  }

  collapseToStart() {
    if (this.rangeCount > 0) {
      this.collapse(this.ranges[0].startContainer, this.ranges[0].startOffset);
    }
  }

  collapseToEnd() {
    if (this.rangeCount > 0) {
      this.collapse(this.ranges[0].endContainer, this.ranges[0].endOffset);
    }
  }

  extend = vi.fn();
  selectAllChildren = vi.fn();
  deleteFromDocument = vi.fn();
  containsNode = vi.fn(() => false);
}

const globalSelection = new MockSelection();
window.getSelection = () => globalSelection as unknown as Selection;
document.getSelection = () => globalSelection as unknown as Selection;
