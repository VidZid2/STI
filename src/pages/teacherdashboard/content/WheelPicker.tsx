import { useReducedMotion } from 'motion/react';
import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type WheelPickerProps = {
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  visibleCount?: number;
  itemHeight?: number;
  className?: string;
  'aria-label': string;
};

const DEG = Math.PI / 180;
const DECELERATION = 0.00042;
const MAX_VELOCITY = 0.18;
const VELOCITY_WINDOW = 90;
const WHEEL_SENSITIVITY = 0.012;
const WHEEL_SETTLE_DELAY = 110;
const BACK = 1.35;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3;
const easeOutBack = (progress: number) => (
  1 + (BACK + 1) * (progress - 1) ** 3 + BACK * (progress - 1) ** 2
);

export function WheelPicker({
  options,
  value,
  onValueChange,
  visibleCount = 5,
  itemHeight = 42,
  className = '',
  'aria-label': ariaLabel,
}: WheelPickerProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const lastIndex = options.length - 1;
  const indexOf = useCallback((nextValue: string) => {
    const index = options.indexOf(nextValue);
    return index < 0 ? 0 : index;
  }, [options]);

  const { height, hideBeyond, itemAngle, radius } = useMemo(() => {
    const rowsEachSide = Math.max(1, Math.floor(visibleCount / 2));
    const cutoff = rowsEachSide + 1;
    const angle = 90 / cutoff;
    const drumRadius = itemHeight / Math.tan(angle * DEG);
    return {
      height: Math.round(2 * drumRadius * Math.sin(rowsEachSide * angle * DEG) + itemHeight),
      hideBeyond: cutoff,
      itemAngle: angle,
      radius: drumRadius,
    };
  }, [itemHeight, visibleCount]);

  const containerRef = useRef<HTMLDivElement>(null);
  const drumRef = useRef<HTMLUListElement>(null);
  const bandRef = useRef<HTMLUListElement>(null);
  const scrollRef = useRef(indexOf(value));
  const animationFrameRef = useRef(0);
  const dragFrameRef = useRef(0);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committedValueRef = useRef(value);
  const latestPointerYRef = useRef(0);
  const dragRef = useRef<{ startY: number; startScroll: number; points: [number, number][] } | null>(null);
  const [grabbing, setGrabbing] = useState(false);

  const paint = useCallback((scrollPosition: number) => {
    const updateLayer = (layer: HTMLUListElement | null) => {
      if (!layer) return;
      layer.style.transform = `translateZ(${-radius}px) rotateX(${itemAngle * scrollPosition}deg)`;
      for (const child of Array.from(layer.children)) {
        const item = child as HTMLLIElement;
        const index = Number(item.dataset.index);
        const visibility = Math.abs(index - scrollPosition) > hideBeyond ? 'hidden' : 'visible';
        if (item.style.visibility !== visibility) item.style.visibility = visibility;
      }
    };
    updateLayer(drumRef.current);
    updateLayer(bandRef.current);
  }, [hideBeyond, itemAngle, radius]);

  const commit = useCallback((index: number) => {
    if (lastIndex < 0) return;
    const nextValue = options[clamp(index, 0, lastIndex)];
    if (nextValue === committedValueRef.current) return;
    committedValueRef.current = nextValue;
    onValueChange(nextValue);
  }, [lastIndex, onValueChange, options]);

  const stopAnimation = useCallback(() => cancelAnimationFrame(animationFrameRef.current), []);

  const glide = useCallback((
    target: number,
    duration: number,
    easing: (progress: number) => number = easeOutCubic,
  ) => {
    stopAnimation();
    const from = scrollRef.current;
    const distance = target - from;
    if (!distance || duration <= 0 || reduceMotion) {
      scrollRef.current = target;
      paint(target);
      commit(Math.round(target));
      return;
    }
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = (now - startedAt) / duration;
      if (progress >= 1) {
        scrollRef.current = target;
        paint(target);
        commit(Math.round(target));
        return;
      }
      scrollRef.current = from + distance * easing(progress);
      paint(scrollRef.current);
      animationFrameRef.current = requestAnimationFrame(tick);
    };
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [commit, paint, reduceMotion, stopAnimation]);

  const fling = useCallback((velocity: number) => {
    const from = scrollRef.current;
    if (from < 0 || from > lastIndex) {
      glide(clamp(Math.round(from), 0, lastIndex), 260);
      return;
    }
    const coast = ((velocity * velocity) / (2 * DECELERATION)) * Math.sign(velocity);
    const target = clamp(Math.round(from + coast), 0, lastIndex);
    const duration = clamp(Math.sqrt(Math.abs(target - from)) * 300 + 240, 280, 1700);
    glide(target, duration, easeOutBack);
  }, [glide, lastIndex]);

  const beginDrag = useCallback((clientY: number) => {
    stopAnimation();
    setGrabbing(true);
    dragRef.current = {
      startY: clientY,
      startScroll: scrollRef.current,
      points: [[clientY, performance.now()]],
    };
  }, [stopAnimation]);

  const moveDrag = useCallback((clientY: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    latestPointerYRef.current = clientY;
    drag.points.push([clientY, performance.now()]);
    if (drag.points.length > 8) drag.points.shift();
    if (dragFrameRef.current) return;
    dragFrameRef.current = requestAnimationFrame(() => {
      dragFrameRef.current = 0;
      const activeDrag = dragRef.current;
      if (!activeDrag) return;
      let next = activeDrag.startScroll + (activeDrag.startY - latestPointerYRef.current) / itemHeight;
      if (next < 0) next *= 0.3;
      else if (next > lastIndex) next = lastIndex + (next - lastIndex) * 0.3;
      scrollRef.current = next;
      paint(next);
    });
  }, [itemHeight, lastIndex, paint]);

  const endDrag = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    if (dragFrameRef.current) {
      cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = 0;
    }
    dragRef.current = null;
    setGrabbing(false);
    const points = drag.points;
    let velocity = 0;
    if (points.length > 1) {
      const latest = points[points.length - 1];
      let reference = points[0];
      for (const point of points) {
        if (latest[1] - point[1] <= VELOCITY_WINDOW) {
          reference = point;
          break;
        }
      }
      const elapsed = latest[1] - reference[1];
      if (elapsed > 0) {
        velocity = clamp((reference[0] - latest[0]) / itemHeight / elapsed, -MAX_VELOCITY, MAX_VELOCITY);
      }
    }
    fling(velocity);
  }, [fling, itemHeight]);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType === 'touch') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    beginDrag(event.clientY);
  }, [beginDrag, reduceMotion]);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') moveDrag(event.clientY);
  }, [moveDrag]);

  const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    endDrag();
  }, [endDrag]);

  const handleWheel = useCallback((event: globalThis.WheelEvent) => {
    if (reduceMotion) return;
    event.preventDefault();
    stopAnimation();
    const pixels = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    const next = clamp(scrollRef.current + pixels * WHEEL_SENSITIVITY, 0, lastIndex);
    scrollRef.current = next;
    paint(next);
    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    wheelTimerRef.current = setTimeout(() => {
      glide(clamp(Math.round(scrollRef.current), 0, lastIndex), 240, easeOutBack);
    }, WHEEL_SETTLE_DELAY);
  }, [glide, lastIndex, paint, reduceMotion, stopAnimation]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const current = Math.round(scrollRef.current);
    const steps: Record<string, number> = {
      ArrowUp: -1,
      ArrowDown: 1,
      Home: -current,
      End: lastIndex - current,
    };
    if (event.key in steps) {
      event.preventDefault();
      glide(clamp(current + steps[event.key], 0, lastIndex), 300, easeOutBack);
    }
  }, [glide, lastIndex]);

  useEffect(() => {
    const target = indexOf(value);
    committedValueRef.current = value;
    if (dragRef.current) return;
    if (Math.abs(scrollRef.current - target) < 0.001) paint(target);
    else glide(target, 260);
  }, [glide, indexOf, paint, value]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || reduceMotion) return;
    const touchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) beginDrag(touch.clientY);
    };
    const touchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || !dragRef.current) return;
      event.preventDefault();
      moveDrag(touch.clientY);
    };
    element.addEventListener('touchstart', touchStart, { passive: true });
    element.addEventListener('touchmove', touchMove, { passive: false });
    element.addEventListener('touchend', endDrag);
    element.addEventListener('touchcancel', endDrag);
    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      element.removeEventListener('touchstart', touchStart);
      element.removeEventListener('touchmove', touchMove);
      element.removeEventListener('touchend', endDrag);
      element.removeEventListener('touchcancel', endDrag);
      element.removeEventListener('wheel', handleWheel);
    };
  }, [beginDrag, endDrag, handleWheel, moveDrag, reduceMotion]);

  useEffect(() => () => {
    cancelAnimationFrame(animationFrameRef.current);
    cancelAnimationFrame(dragFrameRef.current);
    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
  }, []);

  if (reduceMotion) {
    return (
      <select
        className={`ncp-wheel-picker ncp-wheel-picker--reduced ${className}`.trim()}
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }

  return (
    <div
      ref={containerRef}
      role="spinbutton"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={lastIndex}
      aria-valuenow={indexOf(value)}
      aria-valuetext={value}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`ncp-wheel-picker ncp-wheel-picker--cylinder ${grabbing ? 'is-grabbing' : ''} ${className}`.trim()}
      style={{ height, perspective: 1000 }}
    >
      <ul ref={drumRef} className="ncp-wheel-picker__drum" aria-hidden="true">
        {options.map((option, index) => (
          <li
            key={option}
            data-index={index}
            className="ncp-wheel-picker__drum-item"
            style={{
              top: -itemHeight / 2,
              height: itemHeight,
              transform: `rotateX(${-itemAngle * index}deg) translateZ(${radius}px)`,
            }}
          >
            {option}
          </li>
        ))}
      </ul>
      <div className="ncp-wheel-picker__band" style={{ height: itemHeight, perspective: 1000 }} aria-hidden="true">
        <ul ref={bandRef} className="ncp-wheel-picker__drum">
          {options.map((option, index) => (
            <li
              key={option}
              data-index={index}
              className="ncp-wheel-picker__drum-item ncp-wheel-picker__drum-item--selected"
              style={{
                top: -itemHeight / 2,
                height: itemHeight,
                transform: `rotateX(${-itemAngle * index}deg) translateZ(${radius}px)`,
              }}
            >
              {option}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
