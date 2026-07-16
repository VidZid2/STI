import {
  forwardRef,
  type InputHTMLAttributes,
  type MutableRefObject,
  type Ref,
  type TextareaHTMLAttributes,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import './SpringCaretInput.css';

const DEFAULT_SPRING = {
  stiffness: 500,
  damping: 30,
  mass: 0.5,
} as const;

type TextControl = HTMLInputElement | HTMLTextAreaElement;

const setRef = <T,>(ref: Ref<T> | undefined, value: T | null) => {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as MutableRefObject<T | null>).current = value;
};

const getCaretIndex = (target: TextControl) => {
  const selectionStart = target.selectionStart ?? 0;
  const selectionEnd = target.selectionEnd ?? 0;
  if (selectionStart === selectionEnd) return selectionStart;
  return target.selectionDirection === 'backward' ? selectionStart : selectionEnd;
};

const getLineHeight = (styles: CSSStyleDeclaration) => {
  const parsed = Number.parseFloat(styles.lineHeight);
  return Number.isFinite(parsed) ? parsed : (Number.parseFloat(styles.fontSize) || 16) * 1.2;
};

const getCaretHeight = (styles: CSSStyleDeclaration, lineHeight: number) => {
  const fontSize = Number.parseFloat(styles.fontSize) || 16;
  return Math.min(lineHeight, fontSize * 1.05);
};

const copyTextStyles = (source: CSSStyleDeclaration, target: HTMLElement) => {
  target.style.font = source.font;
  target.style.fontFamily = source.fontFamily;
  target.style.fontSize = source.fontSize;
  target.style.fontStyle = source.fontStyle;
  target.style.fontWeight = source.fontWeight;
  target.style.fontFeatureSettings = source.fontFeatureSettings;
  target.style.fontVariationSettings = source.fontVariationSettings;
  target.style.letterSpacing = source.letterSpacing;
  target.style.lineHeight = source.lineHeight;
  target.style.textAlign = source.textAlign;
  target.style.textIndent = source.textIndent;
  target.style.textTransform = source.textTransform;
  target.style.direction = source.direction;
  target.style.tabSize = source.tabSize;
};

type UseSpringCaretOptions = {
  multiline: boolean;
};

const useSpringCaret = ({ multiline }: UseSpringCaretOptions) => {
  const prefersReducedMotion = useReducedMotion();
  const controlRef = useRef<TextControl>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const caretFrameRef = useRef<number | null>(null);
  const caretX = useMotionValue(0);
  const caretY = useMotionValue(0);
  const caretHeight = useMotionValue(16);
  const caretOpacity = useMotionValue(0);
  const springConfig = prefersReducedMotion
    ? { stiffness: 10_000, damping: 100, mass: 0.1 }
    : DEFAULT_SPRING;
  const springCaretX = useSpring(caretX, springConfig);
  const springCaretY = useSpring(caretY, springConfig);

  const measureInputCaret = useCallback((target: HTMLInputElement, caretIndex: number) => {
    const measure = measureRef.current;
    if (!measure) return null;
    const styles = window.getComputedStyle(target);
    copyTextStyles(styles, measure);
    measure.textContent = target.value.slice(0, caretIndex);
    const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
    const paddingRight = Number.parseFloat(styles.paddingRight) || 0;
    const absoluteX = paddingLeft + measure.getBoundingClientRect().width;
    const maxScroll = Math.max(0, target.scrollWidth - target.clientWidth);
    const visibleLeft = target.scrollLeft + paddingLeft;
    const visibleRight = target.scrollLeft + target.clientWidth - paddingRight;

    if (absoluteX > visibleRight) {
      target.scrollLeft = Math.min(absoluteX - target.clientWidth + paddingRight, maxScroll);
    } else if (absoluteX < visibleLeft) {
      target.scrollLeft = Math.max(0, absoluteX - paddingLeft);
    }

    const lineHeight = getLineHeight(styles);
    const height = getCaretHeight(styles, lineHeight);
    return {
      x: target.offsetLeft + absoluteX - target.scrollLeft,
      y: target.offsetTop + (target.clientHeight - height) / 2,
      height,
      visible: absoluteX >= target.scrollLeft && absoluteX <= target.scrollLeft + target.clientWidth,
    };
  }, []);

  const measureTextareaCaret = useCallback((target: HTMLTextAreaElement, caretIndex: number) => {
    const mirror = mirrorRef.current;
    if (!mirror) return null;
    const styles = window.getComputedStyle(target);
    copyTextStyles(styles, mirror);
    mirror.style.width = `${target.clientWidth}px`;
    mirror.style.boxSizing = 'border-box';
    mirror.style.padding = `${styles.paddingTop} ${styles.paddingRight} ${styles.paddingBottom} ${styles.paddingLeft}`;
    mirror.style.whiteSpace = target.wrap === 'off' ? 'pre' : 'pre-wrap';
    mirror.style.overflowWrap = styles.overflowWrap || 'break-word';
    mirror.style.wordBreak = styles.wordBreak;
    mirror.replaceChildren(document.createTextNode(target.value.slice(0, caretIndex)));

    const marker = document.createElement('span');
    marker.textContent = '\u200b';
    mirror.appendChild(marker);

    const lineHeight = getLineHeight(styles);
    const height = getCaretHeight(styles, lineHeight);
    const x = target.offsetLeft + marker.offsetLeft - target.scrollLeft;
    const y = target.offsetTop + marker.offsetTop + (lineHeight - height) / 2 - target.scrollTop;
    return {
      x,
      y,
      height,
      visible: x >= target.offsetLeft
        && x <= target.offsetLeft + target.clientWidth
        && y + height >= target.offsetTop
        && y <= target.offsetTop + target.clientHeight,
    };
  }, []);

  const updateCaret = useCallback((target: TextControl) => {
    if (document.activeElement !== target) return;
    const selectionStart = target.selectionStart ?? 0;
    const selectionEnd = target.selectionEnd ?? 0;
    if (selectionStart !== selectionEnd) {
      caretOpacity.set(0);
      return;
    }

    const caretIndex = getCaretIndex(target);
    const position = multiline
      ? measureTextareaCaret(target as HTMLTextAreaElement, caretIndex)
      : measureInputCaret(target as HTMLInputElement, caretIndex);
    if (!position) return;

    caretX.set(position.x);
    caretY.set(position.y);
    caretHeight.set(position.height);
    caretOpacity.set(position.visible ? 1 : 0);
  }, [caretHeight, caretOpacity, caretX, caretY, measureInputCaret, measureTextareaCaret, multiline]);

  const scheduleCaretUpdate = useCallback((target: TextControl) => {
    if (caretFrameRef.current !== null) cancelAnimationFrame(caretFrameRef.current);
    caretFrameRef.current = requestAnimationFrame(() => {
      caretFrameRef.current = null;
      updateCaret(target);
    });
  }, [updateCaret]);

  useEffect(() => {
    const target = controlRef.current;
    if (!target) return undefined;
    const updateIfFocused = () => {
      if (document.activeElement === target) scheduleCaretUpdate(target);
    };
    const handleSelectionChange = () => updateIfFocused();
    const resizeObserver = new ResizeObserver(updateIfFocused);

    document.addEventListener('selectionchange', handleSelectionChange);
    target.addEventListener('scroll', updateIfFocused);
    resizeObserver.observe(target);
    if ('fonts' in document) {
      document.fonts.addEventListener('loadingdone', updateIfFocused);
      document.fonts.ready.then(updateIfFocused).catch(() => undefined);
    }

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      target.removeEventListener('scroll', updateIfFocused);
      resizeObserver.disconnect();
      if ('fonts' in document) document.fonts.removeEventListener('loadingdone', updateIfFocused);
    };
  }, [scheduleCaretUpdate]);

  useEffect(() => () => {
    if (caretFrameRef.current !== null) cancelAnimationFrame(caretFrameRef.current);
  }, []);

  return {
    caretHeight,
    caretOpacity,
    controlRef,
    measureRef,
    mirrorRef,
    scheduleCaretUpdate,
    springCaretX,
    springCaretY,
  };
};

type CaretLayerProps = ReturnType<typeof useSpringCaret> & {
  multiline: boolean;
};

const CaretLayer = ({
  caretHeight,
  caretOpacity,
  measureRef,
  mirrorRef,
  multiline,
  springCaretX,
  springCaretY,
}: CaretLayerProps) => (
  <>
    <span ref={measureRef} className="spring-caret-field__measure" aria-hidden="true" />
    {multiline ? <div ref={mirrorRef} className="spring-caret-field__mirror" aria-hidden="true" /> : null}
    <motion.span
      className="spring-caret-field__caret"
      aria-hidden="true"
      style={{ height: caretHeight, opacity: caretOpacity, x: springCaretX, y: springCaretY }}
    />
  </>
);

export type SpringCaretInputProps = InputHTMLAttributes<HTMLInputElement>;

export const SpringCaretInput = forwardRef<HTMLInputElement, SpringCaretInputProps>((props, forwardedRef) => {
  const { className, onBlur, onChange, onFocus, onKeyDown, onSelect, ...inputProps } = props;
  const caret = useSpringCaret({ multiline: false });

  return (
    <span className="spring-caret-field">
      <input
        {...inputProps}
        ref={(node) => {
          caret.controlRef.current = node;
          setRef(forwardedRef, node);
        }}
        className={`spring-caret-field__control${className ? ` ${className}` : ''}`}
        onBlur={(event) => {
          caret.caretOpacity.set(0);
          onBlur?.(event);
        }}
        onChange={(event) => {
          onChange?.(event);
          caret.scheduleCaretUpdate(event.currentTarget);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          caret.scheduleCaretUpdate(event.currentTarget);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          caret.scheduleCaretUpdate(event.currentTarget);
        }}
        onSelect={(event) => {
          onSelect?.(event);
          caret.scheduleCaretUpdate(event.currentTarget);
        }}
      />
      <CaretLayer {...caret} multiline={false} />
    </span>
  );
});

SpringCaretInput.displayName = 'SpringCaretInput';

export type SpringCaretTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const SpringCaretTextarea = forwardRef<HTMLTextAreaElement, SpringCaretTextareaProps>((props, forwardedRef) => {
  const { className, onBlur, onChange, onFocus, onKeyDown, onSelect, ...textareaProps } = props;
  const caret = useSpringCaret({ multiline: true });

  return (
    <span className="spring-caret-field spring-caret-field--multiline">
      <textarea
        {...textareaProps}
        ref={(node) => {
          caret.controlRef.current = node;
          setRef(forwardedRef, node);
        }}
        className={`spring-caret-field__control${className ? ` ${className}` : ''}`}
        onBlur={(event) => {
          caret.caretOpacity.set(0);
          onBlur?.(event);
        }}
        onChange={(event) => {
          onChange?.(event);
          caret.scheduleCaretUpdate(event.currentTarget);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          caret.scheduleCaretUpdate(event.currentTarget);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          caret.scheduleCaretUpdate(event.currentTarget);
        }}
        onSelect={(event) => {
          onSelect?.(event);
          caret.scheduleCaretUpdate(event.currentTarget);
        }}
      />
      <CaretLayer {...caret} multiline />
    </span>
  );
});

SpringCaretTextarea.displayName = 'SpringCaretTextarea';
