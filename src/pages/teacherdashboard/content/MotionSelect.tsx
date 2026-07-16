import {
  createContext,
  type KeyboardEvent,
  type InputHTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { motion, type Transition, useReducedMotion, type Variants } from 'motion/react';
import './MotionSelect.css';

const INSTANT_TRANSITION: Transition = { duration: 0 };
const CHEVRON_TRANSITION: Transition = { type: 'spring', duration: 0.4, bounce: 0.3 };
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const LIST_VARIANTS: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } },
};

const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: -6, filter: 'blur(3px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

type Placement = 'bottom' | 'top';

type SelectContextValue = {
  value: string | undefined;
  open: boolean;
  setOpen: (open: boolean) => void;
  select: (value: string) => void;
  register: (value: string, label: string) => void;
  unregister: (value: string) => void;
  labelFor: (value: string | undefined) => string | undefined;
  reduce: boolean;
  triggerId: string;
  listId: string;
  disabled: boolean;
  placement: Placement;
  setPlacement: (placement: Placement) => void;
};

const SelectContext = createContext<SelectContextValue | null>(null);

const useSelectContext = (component: string) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error(`${component} must be used within <Select>`);
  return context;
};

const joinClasses = (...classes: Array<string | undefined | false>) => classes.filter(Boolean).join(' ');

export type SelectProps = {
  id?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

export function Select({
  id,
  value,
  defaultValue,
  onValueChange,
  onOpenChange,
  disabled = false,
  className,
  children,
}: SelectProps) {
  const reduce = useReducedMotion() ?? false;
  const generatedId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [labels, setLabels] = useState<Map<string, string>>(new Map());
  const [placement, setPlacement] = useState<Placement>('bottom');

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);
  const controlled = value !== undefined;
  const currentValue = controlled ? value : internalValue;
  const triggerId = id ?? `${generatedId}-trigger`;

  const select = useCallback((nextValue: string) => {
    if (!controlled) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
    requestAnimationFrame(() => document.getElementById(triggerId)?.focus());
  }, [controlled, onValueChange, triggerId]);

  const register = useCallback((itemValue: string, label: string) => {
    setLabels((currentLabels) => (
      currentLabels.get(itemValue) === label
        ? currentLabels
        : new Map(currentLabels).set(itemValue, label)
    ));
  }, []);

  const unregister = useCallback((itemValue: string) => {
    setLabels((currentLabels) => {
      if (!currentLabels.has(itemValue)) return currentLabels;
      const nextLabels = new Map(currentLabels);
      nextLabels.delete(itemValue);
      return nextLabels;
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      document.getElementById(triggerId)?.focus();
    };
    const handleOutsidePointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('pointerdown', handleOutsidePointer);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('pointerdown', handleOutsidePointer);
    };
  }, [open, triggerId]);

  const context = useMemo<SelectContextValue>(() => ({
    value: currentValue,
    open,
    setOpen,
    select,
    register,
    unregister,
    labelFor: (itemValue) => (itemValue === undefined ? undefined : labels.get(itemValue)),
    reduce,
    triggerId,
    listId: `${triggerId}-listbox`,
    disabled,
    placement,
    setPlacement,
  }), [currentValue, disabled, labels, open, placement, reduce, register, select, triggerId, unregister]);

  return (
    <SelectContext.Provider value={context}>
      <div
        ref={rootRef}
        className={joinClasses('motion-select', open && 'motion-select--open', className)}
      >
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export type SelectTriggerProps = {
  className?: string;
  children: ReactNode;
};

export function SelectTrigger({ className, children }: SelectTriggerProps) {
  const context = useSelectContext('SelectTrigger');
  const opensUpward = context.placement === 'top';
  const radiusFrames = context.open ? [0, 0, 7] : [7, 0, 7];
  const radiusTransition: Transition = context.reduce
    ? { duration: 0 }
    : context.open
      ? { duration: 0.6, times: [0, 0.4, 1], ease: EASE_OUT }
      : { duration: 0.42, times: [0, 0.5, 1], ease: EASE_OUT };

  const focusItem = (position: 'first' | 'last') => {
    requestAnimationFrame(() => {
      const items = document.querySelectorAll<HTMLButtonElement>(`#${CSS.escape(context.listId)} [data-motion-select-item]:not(:disabled)`);
      const item = position === 'first' ? items[0] : items[items.length - 1];
      item?.focus();
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    context.setOpen(true);
    focusItem(event.key === 'ArrowDown' ? 'first' : 'last');
  };

  return (
    <motion.button
      type="button"
      id={context.triggerId}
      disabled={context.disabled}
      aria-haspopup="listbox"
      aria-expanded={context.open}
      aria-controls={context.listId}
      onClick={() => context.setOpen(!context.open)}
      onKeyDown={handleKeyDown}
      initial={false}
      animate={{
        borderTopLeftRadius: opensUpward ? radiusFrames : 7,
        borderTopRightRadius: opensUpward ? radiusFrames : 7,
        borderBottomLeftRadius: opensUpward ? 7 : radiusFrames,
        borderBottomRightRadius: opensUpward ? 7 : radiusFrames,
      }}
      transition={{
        borderTopLeftRadius: opensUpward ? radiusTransition : INSTANT_TRANSITION,
        borderTopRightRadius: opensUpward ? radiusTransition : INSTANT_TRANSITION,
        borderBottomLeftRadius: opensUpward ? INSTANT_TRANSITION : radiusTransition,
        borderBottomRightRadius: opensUpward ? INSTANT_TRANSITION : radiusTransition,
      }}
      className={joinClasses('motion-select__trigger', className)}
    >
      <span className="motion-select__value-wrap">{children}</span>
      <motion.span
        aria-hidden="true"
        animate={{ rotate: context.open ? 180 : 0 }}
        transition={context.reduce ? { duration: 0 } : CHEVRON_TRANSITION}
        className="motion-select__chevron"
      >
        <ChevronDown />
      </motion.span>
    </motion.button>
  );
}

export type SelectInputTriggerProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string;
  onValueChange: (value: string) => void;
};

export function SelectInputTrigger({
  className,
  value,
  onValueChange,
  ...inputProps
}: SelectInputTriggerProps) {
  const context = useSelectContext('SelectInputTrigger');
  const emptyCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opensUpward = context.placement === 'top';
  const radiusFrames = context.open ? [0, 0, 7] : [7, 0, 7];
  const radiusTransition: Transition = context.reduce
    ? { duration: 0 }
    : context.open
      ? { duration: 0.6, times: [0, 0.4, 1], ease: EASE_OUT }
      : { duration: 0.42, times: [0, 0.5, 1], ease: EASE_OUT };

  const clearEmptyCloseTimer = useCallback(() => {
    if (emptyCloseTimerRef.current) {
      clearTimeout(emptyCloseTimerRef.current);
      emptyCloseTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearEmptyCloseTimer, [clearEmptyCloseTimer]);

  return (
    <motion.div
      initial={false}
      animate={{
        borderTopLeftRadius: opensUpward ? radiusFrames : 7,
        borderTopRightRadius: opensUpward ? radiusFrames : 7,
        borderBottomLeftRadius: opensUpward ? 7 : radiusFrames,
        borderBottomRightRadius: opensUpward ? 7 : radiusFrames,
      }}
      transition={{
        borderTopLeftRadius: opensUpward ? radiusTransition : INSTANT_TRANSITION,
        borderTopRightRadius: opensUpward ? radiusTransition : INSTANT_TRANSITION,
        borderBottomLeftRadius: opensUpward ? INSTANT_TRANSITION : radiusTransition,
        borderBottomRightRadius: opensUpward ? INSTANT_TRANSITION : radiusTransition,
      }}
      className={joinClasses('motion-select__input-trigger', className)}
    >
      <input
        {...inputProps}
        id={context.triggerId}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={context.open}
        aria-controls={context.listId}
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;
          clearEmptyCloseTimer();
          onValueChange(nextValue);
          context.setOpen(true);

          if (!nextValue.trim()) {
            emptyCloseTimerRef.current = setTimeout(() => {
              context.setOpen(false);
              emptyCloseTimerRef.current = null;
            }, 1000);
          }
        }}
      />
      <button
        type="button"
        aria-label={context.open ? 'Close section suggestions' : 'Open section suggestions'}
        onClick={() => {
          clearEmptyCloseTimer();
          context.setOpen(!context.open);
        }}
      >
        <motion.span
          aria-hidden="true"
          animate={{ rotate: context.open ? 180 : 0 }}
          transition={context.reduce ? { duration: 0 } : CHEVRON_TRANSITION}
          className="motion-select__chevron"
        >
          <ChevronDown />
        </motion.span>
      </button>
    </motion.div>
  );
}

export type SelectValueProps = {
  placeholder?: string;
  className?: string;
};

export function SelectValue({ placeholder, className }: SelectValueProps) {
  const context = useSelectContext('SelectValue');
  const label = context.labelFor(context.value);
  return (
    <span className={joinClasses('motion-select__value', !label && 'motion-select__value--placeholder', className)}>
      {label ?? placeholder ?? 'Select'}
    </span>
  );
}

export type SelectContentProps = {
  className?: string;
  children: ReactNode;
};

export function SelectContent({ className, children }: SelectContentProps) {
  const context = useSelectContext('SelectContent');
  const innerRef = useRef<HTMLUListElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const node = innerRef.current;
    if (!node) return undefined;
    const measure = () => setHeight(node.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [children]);

  useLayoutEffect(() => {
    if (!context.open) return;
    const trigger = document.getElementById(context.triggerId);
    const list = innerRef.current;
    if (!trigger || !list) return;
    const triggerRect = trigger.getBoundingClientRect();
    const listHeight = list.offsetHeight;
    const roomBelow = window.innerHeight - triggerRect.bottom;
    const roomAbove = triggerRect.top;
    context.setPlacement(roomBelow < listHeight + 16 && roomAbove > roomBelow ? 'top' : 'bottom');
  }, [context.open, context.triggerId, context.setPlacement]);

  const opensUpward = context.placement === 'top';
  const nearGap = context.open ? 8 : 0;
  const nearRadius = context.open ? 7 : 0;
  const gapTransition: Transition = context.open
    ? { type: 'spring', duration: 0.6, bounce: 0.5, delay: 0.12 }
    : { type: 'spring', duration: 0.3, bounce: 0.1 };
  const radiusTransition: Transition = context.open
    ? { duration: 0.3, ease: EASE_OUT, delay: 0.14 }
    : { duration: 0.16, ease: EASE_OUT };

  return (
    <motion.div
      id={context.listId}
      role="listbox"
      aria-labelledby={context.triggerId}
      aria-hidden={!context.open}
      initial={false}
      animate={context.reduce
        ? { opacity: context.open ? 1 : 0, height: context.open ? height : 0 }
        : {
            opacity: context.open ? 1 : 0,
            height: context.open ? height : 0,
            marginTop: opensUpward ? 0 : nearGap,
            marginBottom: opensUpward ? nearGap : 0,
            borderTopLeftRadius: opensUpward ? 7 : nearRadius,
            borderTopRightRadius: opensUpward ? 7 : nearRadius,
            borderBottomLeftRadius: opensUpward ? nearRadius : 7,
            borderBottomRightRadius: opensUpward ? nearRadius : 7,
          }}
      transition={context.reduce
        ? { duration: 0.12 }
        : {
            opacity: context.open ? { duration: 0.18 } : { duration: 0.16, delay: 0.12 },
            height: context.open
              ? { type: 'spring', duration: 0.42, bounce: 0.14 }
              : { duration: 0.26, ease: EASE_OUT, delay: 0.14 },
            marginTop: opensUpward ? INSTANT_TRANSITION : gapTransition,
            marginBottom: opensUpward ? gapTransition : INSTANT_TRANSITION,
            borderTopLeftRadius: opensUpward ? INSTANT_TRANSITION : radiusTransition,
            borderTopRightRadius: opensUpward ? INSTANT_TRANSITION : radiusTransition,
            borderBottomLeftRadius: opensUpward ? radiusTransition : INSTANT_TRANSITION,
            borderBottomRightRadius: opensUpward ? radiusTransition : INSTANT_TRANSITION,
          }}
      style={{
        overflow: 'hidden',
        pointerEvents: context.open ? 'auto' : 'none',
        transformOrigin: opensUpward ? 'bottom' : 'top',
      }}
      className={joinClasses(
        'motion-select__content',
        opensUpward ? 'motion-select__content--top' : 'motion-select__content--bottom',
        className,
      )}
    >
      <motion.ul
        ref={innerRef}
        variants={context.reduce ? undefined : LIST_VARIANTS}
        initial={false}
        animate={context.open ? 'show' : 'hidden'}
        className="motion-select__list"
      >
        {children}
      </motion.ul>
    </motion.div>
  );
}

export type SelectItemProps = {
  value: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

export function SelectItem({ value, disabled = false, className, children }: SelectItemProps) {
  const context = useSelectContext('SelectItem');
  const selected = context.value === value;
  const label = typeof children === 'string' ? children : value;

  useLayoutEffect(() => {
    context.register(value, label);
    return () => context.unregister(value);
  }, [context.register, context.unregister, label, value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const items = Array.from(
      document.querySelectorAll<HTMLButtonElement>(`#${CSS.escape(context.listId)} [data-motion-select-item]:not(:disabled)`),
    );
    const currentIndex = items.indexOf(event.currentTarget);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      items[(currentIndex + direction + items.length) % items.length]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
    }
  };

  return (
    <motion.li variants={context.reduce ? undefined : ITEM_VARIANTS} className="motion-select__item-shell">
      <button
        type="button"
        role="option"
        aria-selected={selected}
        disabled={disabled}
        tabIndex={context.open ? 0 : -1}
        data-motion-select-item
        onClick={() => context.select(value)}
        onKeyDown={handleKeyDown}
        className={joinClasses('motion-select__item', selected && 'motion-select__item--selected', className)}
      >
        <span>{children}</span>
        {selected ? <Check aria-hidden="true" /> : null}
      </button>
    </motion.li>
  );
}
