// @ts-nocheck
"use client";

import { motion, AnimatePresence } from "motion/react";
import { Combobox } from "@base-ui/react/combobox";
import { PreviewCard } from "@base-ui/react/preview-card";
import {
  BrainIcon,
  CaretDownIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  PaperPlaneTiltIcon,
  InfoIcon,
} from "@phosphor-icons/react";
import { Loader2 } from "lucide-react";
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AsciiText } from "@/components/ui/ascii-text";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Context,
  ContextCacheUsage,
  ContextContent,
  ContextContentBody,
  ContextContentFooter,
  ContextContentHeader,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextTrigger,
} from "@/components/ai-elements/context";

export type LlmModel = {
  value: string;
  label: string;
  provider: string;
  description: string;
  contextWindow: string;
  inputPrice: string;
  outputPrice: string;
  hasSpeedConfiguration?: boolean;
  metrics: {
    intelligence: number;
    speed: number;
    context: number;
    cost: number;
  };
};

export const DEFAULT_LLM_MODELS: LlmModel[] = [
  {
    value: "ai-helper",
    label: "AI Helper",
    provider: "Our AI",
    description: "Our flagship AI helper for all your tasks and queries.",
    contextWindow: "256k",
    inputPrice: "Free",
    outputPrice: "Free",
    metrics: { intelligence: 8.5, speed: 9.2, context: 4, cost: 0 },
  },
];

const DEFAULT_MODEL = DEFAULT_LLM_MODELS[0];

export type ReasoningLevel = "low" | "medium" | "high";
export type SpeedLevel = "standard" | "fast";

export type ModelConfiguration = {
  reasoning: ReasoningLevel;
  speed: SpeedLevel;
};

export type ModelSelectorSubmitPayload = {
  configuration: ModelConfiguration;
  configurations: Record<string, ModelConfiguration>;
  model: LlmModel;
  prompt: string;
};

export type ModelSelectorPromptProps = {
  className?: string;
  configurations?: Record<string, ModelConfiguration>;
  defaultConfigurations?: Record<string, ModelConfiguration>;
  defaultPrompt?: string;
  defaultValue?: string;
  disabled?: boolean;
  models?: readonly LlmModel[];
  onConfigurationChange?: (
    modelValue: string,
    configuration: ModelConfiguration,
    configurations: Record<string, ModelConfiguration>,
  ) => void;
  onModelChange?: (model: LlmModel) => void;
  onPromptChange?: (prompt: string) => void;
  onSubmit?: (payload: ModelSelectorSubmitPayload) => void | Promise<void>;
  placeholder?: string;
  prompt?: string;
  value?: string;
};

const WAVE_WASH_GRADIENT =
  "linear-gradient(180deg, transparent, rgba(100,149,237,0.3), rgba(100,149,237,0.5), rgba(100,149,237,0.7), rgba(100,149,237,0.5), rgba(100,149,237,0.3), transparent)";

function SendWave() {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[10] overflow-hidden rounded-[inherit]"
      exit={{ opacity: 0 }}
      initial={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <motion.div
        animate={{ y: "-105%" }}
        className="absolute inset-x-0 top-0 h-[150%] blur-xl"
        initial={{ y: "55%" }}
        style={{ background: WAVE_WASH_GRADIENT }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </motion.div>
  );
}

const DEFAULT_MODEL_CONFIGURATION: ModelConfiguration = {
  reasoning: "medium",
  speed: "standard",
};

function getModelConfiguration(
  configurations: Record<string, ModelConfiguration>,
  modelValue: string,
): ModelConfiguration {
  return configurations[modelValue] ?? DEFAULT_MODEL_CONFIGURATION;
}

const REASONING_INTELLIGENCE_DELTA: Record<ReasoningLevel, number> = {
  low: -2,
  medium: 0,
  high: 2,
};
const SPEED_METRIC_DELTA: Record<SpeedLevel, number> = {
  standard: 0,
  fast: 2,
};

function clampMetric(value: number) {
  return Math.min(10, Math.max(0, value));
}

function ProviderIcon({
  provider,
  className,
}: {
  provider: string;
  className?: string;
}) {
  const base = cn("size-3 shrink-0", className);
  if (provider === "Anthropic") {
    return (
      <svg className={base} viewBox="0 0 24 24" fill="#D97757" aria-hidden="true">
        <path d="M13.6 3h3.1l6.3 18h-3.2l-1.3-3.8h-6.6L10.7 21H7.5L13.6 3Zm-1.6 3.9-2.3 6.9h4.7L12 6.9Z" />
      </svg>
    );
  }
  if (provider === "OpenAI") {
    return (
      <svg className={base} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    );
  }
  if (provider === "Gemini") {
    return (
      <svg className={base} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 2c.4 4.7 3.3 8.4 8 9-4.7.6-7.6 4.3-8 9-.4-4.7-3.3-8.4-8-9 4.7-.6 7.6-4.3 8-9Z"
          fill="#3B82F6"
        />
      </svg>
    );
  }
  if (provider === "OpenCode Zen" || provider === "Our AI") {
    return (
      <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2c0 5.5-4.5 10-10 10 5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z" />
      </svg>
    );
  }
  return <BrainIcon className={base} />;
}

function ProviderLabel({
  provider,
  className,
}: {
  provider: string;
  className?: string;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <ProviderIcon provider={provider} />
      <span className="truncate">{provider}</span>
    </span>
  );
}

const REASONING_LABELS: Record<ReasoningLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

function ModelConfigurationBadge({
  model,
  configuration,
}: {
  model: LlmModel;
  configuration: ModelConfiguration;
}) {
  const showReasoning = configuration.reasoning !== "medium";
  const showFast = model.hasSpeedConfiguration && configuration.speed === "fast";

  const badgeClassName =
    "inline-flex items-center gap-0.5 rounded-md bg-neutral-100 px-1 py-0.5 text-neutral-500 text-[10px] group-data-[selected]:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:group-data-[selected]:bg-neutral-700";
  return (
    <div className="flex shrink-0 items-center gap-1 overflow-hidden">
      <AnimatePresence>
        {showReasoning && (
          <motion.div
            layout
            key="reasoning"
            initial={{ opacity: 0, width: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, width: "auto", filter: "blur(0px)" }}
            exit={{ opacity: 0, width: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.3, type: "spring", stiffness: 350, damping: 25 }}
            className="flex shrink-0 overflow-hidden"
          >
            <div className={cn(
              badgeClassName, 
              "whitespace-nowrap transition-colors duration-500",
              configuration.reasoning === "high" && "bg-[#6495ED]/10 text-[#6495ED] group-data-[selected]:bg-[#6495ED]/20 dark:bg-[#6495ED]/20 dark:text-[#6495ED] dark:group-data-[selected]:bg-[#6495ED]/30",
              configuration.reasoning === "low" && "bg-[#10b981]/10 text-[#10b981] group-data-[selected]:bg-[#10b981]/20 dark:bg-[#10b981]/20 dark:text-[#10b981] dark:group-data-[selected]:bg-[#10b981]/30"
            )}>
              <BrainIcon 
                className={cn(
                  "shrink-0 transition-colors duration-500", 
                  configuration.reasoning === "high" ? "text-[#6495ED]" : configuration.reasoning === "low" ? "text-[#10b981]" : "text-neutral-500 dark:text-neutral-400"
                )} 
                size={11} 
                weight="fill" 
              />
              <AsciiText key={configuration.reasoning} text={REASONING_LABELS[configuration.reasoning]} duration={800} />
            </div>
          </motion.div>
        )}
        {showFast && (
          <motion.div
            layout
            key="fast"
            initial={{ opacity: 0, width: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, width: "auto", filter: "blur(0px)" }}
            exit={{ opacity: 0, width: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.3, type: "spring", stiffness: 350, damping: 25 }}
            className="flex shrink-0 overflow-hidden"
          >
            <div className={cn(badgeClassName, "whitespace-nowrap")}>
              <LightningIcon className="text-amber-500 shrink-0" size={11} weight="fill" />
              Fast
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const GrowSegment = memo(function GrowSegment({
  finalColor,
  delay,
  fillFraction,
}: {
  finalColor: string;
  delay: number;
  fillFraction: number;
}) {
  const [scale, setScale] = useState(0);
  const [color, setColor] = useState("#f97316"); // start orange
  const [hasBooted, setHasBooted] = useState(false);

  useEffect(() => {
    // Phase 1: Grow (happens on mount and updates)
    const growTimer = setTimeout(() => {
      setScale(fillFraction);
    }, 10);
    return () => clearTimeout(growTimer);
  }, [fillFraction]);

  const prevFillFraction = useRef(fillFraction);

  useEffect(() => {
    let colorTimer: NodeJS.Timeout;
    
    const isIncrease = fillFraction > prevFillFraction.current;
    
    if (!hasBooted || isIncrease) {
      if (fillFraction > 0) {
        setColor("#f97316");
        // Phase 2: After growth animation completes, transition to final color
        colorTimer = setTimeout(() => {
          setColor(finalColor);
          if (!hasBooted) setHasBooted(true);
        }, delay + 300);
      } else {
        setColor(finalColor);
        if (!hasBooted) setHasBooted(true);
      }
    } else {
      // On subsequent updates where it shrinks or stays same, keep final color
      setColor(finalColor);
    }
    
    prevFillFraction.current = fillFraction;

    return () => {
      clearTimeout(colorTimer);
    };
  }, [fillFraction, finalColor, delay, hasBooted]);

  return (
    <div
      className="h-full w-full origin-bottom rounded-sm"
      style={{
        backgroundColor: color,
        transform: `scaleY(${scale})`,
        willChange: "transform, background-color",
        transition: `transform 300ms ease-out ${delay}ms, background-color 300ms ease-out 0ms`,
      }}
    />
  );
}
);

const MetricBar = memo(function MetricBar({
  label,
  value,
  info,
  invert = false,
  animationKey,
  forceOpenTooltip,
}: {
  label: string;
  value: number;
  info?: string;
  invert?: boolean;
  animationKey: string;
  forceOpenTooltip?: boolean;
}) {
  const finalColor = invert ? "#e5484d" : "#30a46c";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono font-medium text-[10px] text-neutral-400 uppercase leading-none dark:text-neutral-500">
          {label}
        </span>
        {info ? (
          <TooltipProvider delayDuration={100}>
            <Tooltip open={forceOpenTooltip ? true : undefined}>
              <TooltipTrigger asChild>
                <button type="button" className="cursor-help text-neutral-400 leading-none dark:text-neutral-500 hover:text-neutral-500 dark:hover:text-neutral-400 transition-colors">
                  <InfoIcon weight="fill" className="size-[11px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                sideOffset={6} 
                hideArrow={true}
                inline={forceOpenTooltip}
                className="z-[9999] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black border-none rounded-md px-2.5 py-1.5 text-xs font-medium shadow-md max-w-[200px]"
              >
                {info}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>
      <div
        aria-label={`${label}: ${value} out of 10`}
        className="grid grid-cols-10 gap-1"
        key={animationKey}
        role="img"
      >
        {Array.from({ length: 10 }, (_, index) => {
          const fillFraction = Math.max(0, Math.min(1, value - index));
          return (
            <div
              className="h-3 overflow-hidden rounded-sm bg-neutral-100 dark:bg-neutral-800"
              key={index}
            >
              <GrowSegment
                finalColor={finalColor}
                delay={index * 25}
                fillFraction={fillFraction}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
);

const SegmentedRadio = memo(function SegmentedRadio<TValue extends string>({
  ariaLabel,
  onValueChange,
  options,
  value,
}: {
  ariaLabel: string;
  onValueChange: (value: TValue) => void;
  options: { label: string; value: TValue }[];
  value: TValue;
}) {
  return (
    <div aria-label={ariaLabel} className="flex gap-1" role="radiogroup">
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            aria-checked={checked}
            className={cn(
              "flex-1 rounded-md px-2 py-1 text-xs transition-colors",
              checked
                ? option.value === "high"
                  ? "bg-[#6495ED] text-white shadow-sm"
                  : option.value === "low"
                    ? "bg-[#10b981] text-white shadow-sm"
                    : "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-white",
            )}
            key={option.value}
            onClick={() => onValueChange(option.value)}
            role="radio"
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
) as <TValue extends string>(props: {
  ariaLabel: string;
  onValueChange: (value: TValue) => void;
  options: { label: string; value: TValue }[];
  value: TValue;
}) => ReactNode;

function Button({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-neutral-900 px-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

const ModelPreviewPanel = memo(function ModelPreviewPanel({
  model,
  configuration,
  onConfigurationChange,
}: {
  model: LlmModel;
  configuration: ModelConfiguration;
  onConfigurationChange: (update: Partial<ModelConfiguration>) => void;
}) {
  const [animationCounter] = useState(() => Date.now());
  const { reasoning, speed } = configuration;
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    if (isMobile) {
      const timer0 = setTimeout(() => {
        setActiveTooltip("Context");
      }, 600);
      const timer1 = setTimeout(() => {
        setActiveTooltip("Cost");
      }, 2600);
      const timer2 = setTimeout(() => {
        setActiveTooltip(null);
      }, 4600);
      return () => {
        clearTimeout(timer0);
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setActiveTooltip(null);
    }
  }, [isMobile]);

  const adjustedMetrics = useMemo(
    () => ({
      intelligence: clampMetric(
        model.metrics.intelligence + REASONING_INTELLIGENCE_DELTA[reasoning],
      ),
      speed: clampMetric(
        model.metrics.speed +
          (model.hasSpeedConfiguration ? SPEED_METRIC_DELTA[speed] : 0),
      ),
      context: model.metrics.context,
      cost: model.metrics.cost,
    }),
    [model.hasSpeedConfiguration, model.metrics, reasoning, speed],
  );
  return (
    <div className="flex w-56 flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-neutral-900 text-sm dark:text-neutral-100">{model.label}</p>
          <ProviderLabel
            className="text-neutral-500 text-xs dark:text-neutral-400"
            provider={model.provider}
          />
        </div>
        <p className="text-pretty text-neutral-500 text-xs leading-4 dark:text-neutral-400">
          {model.description}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
          <MetricBar
            animationKey={`${model.value}-${animationCounter}`}
            label="Intelligence"
            value={adjustedMetrics.intelligence}
          />
          <MetricBar
            animationKey={`${model.value}-${animationCounter}`}
            label="Speed"
            value={adjustedMetrics.speed}
          />
          <MetricBar
            animationKey={`${model.value}-${animationCounter}`}
            info={`${model.contextWindow} context window`}
            label="Context"
            value={adjustedMetrics.context}
            forceOpenTooltip={activeTooltip === "Context"}
          />
          <MetricBar
            animationKey={`${model.value}-${animationCounter}`}
            info={model.inputPrice === "Free" && model.outputPrice === "Free" ? "Free" : `${model.inputPrice} input · ${model.outputPrice} output`}
            invert
            label="Cost"
            value={adjustedMetrics.cost}
            forceOpenTooltip={activeTooltip === "Cost"}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 p-3">
        <p className="font-mono font-medium text-[10px] text-neutral-500 uppercase leading-none dark:text-neutral-400">
          Configuration
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-neutral-500 text-xs leading-none dark:text-neutral-400">Reasoning</p>
          <SegmentedRadio<ReasoningLevel>
            ariaLabel="Reasoning level"
            onValueChange={(reasoningValue) =>
              onConfigurationChange({ reasoning: reasoningValue })
            }
            options={[
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
            ]}
            value={reasoning}
          />
        </div>
        {model.hasSpeedConfiguration ? (
          <div className="flex flex-col gap-2">
            <p className="text-neutral-500 text-xs leading-none dark:text-neutral-400">Speed</p>
            <SegmentedRadio<SpeedLevel>
              ariaLabel="Speed"
              onValueChange={(speedValue) =>
                onConfigurationChange({ speed: speedValue })
              }
              options={[
                { label: "Standard", value: "standard" },
                { label: "Fast", value: "fast" },
              ]}
              value={speed}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
});

function ModelListWithScrollFade({ children }: { children: ReactNode | ((item: any) => ReactNode) }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [showBottomFade, setShowBottomFade] = useState(false);
  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    let ticking = false;
    function updateBottomFade() {
      if (!ticking) {
        requestAnimationFrame(() => {
          const el = listRef.current;
          if (el) {
            const { scrollTop, scrollHeight, clientHeight } = el;
            setShowBottomFade(scrollHeight - scrollTop - clientHeight > 4);
          }
          ticking = false;
        });
        ticking = true;
      }
    }
    updateBottomFade();
    list.addEventListener("scroll", updateBottomFade, { passive: true });
    const resizeObserver = new ResizeObserver(updateBottomFade);
    resizeObserver.observe(list);
    return () => {
      list.removeEventListener("scroll", updateBottomFade);
      resizeObserver.disconnect();
    };
  }, []);
  return (
    <div className="relative">
      <Combobox.List
        className="max-h-64 overflow-y-auto overscroll-contain p-1"
        ref={listRef}
      >
        {children}
      </Combobox.List>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-150 dark:from-neutral-900",
          showBottomFade ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

const ModelComboboxItem = memo(function ModelComboboxItem({
  model,
  configuration,
  previewHandle,
}: {
  model: LlmModel;
  configuration: ModelConfiguration;
  previewHandle: PreviewCard.Handle<string>;
}) {
  return (
    <Combobox.Item
      className="group w-full p-0 text-neutral-700 data-[selected]:text-neutral-900 dark:text-neutral-300 dark:data-[selected]:text-neutral-100"
      value={model}
    >
      <PreviewCard.Trigger
        id={model.value}
        className="flex w-full items-start gap-2 rounded-md px-1.5 py-1.5 hover:bg-neutral-100 group-data-[selected]:bg-neutral-100 dark:hover:bg-neutral-800 dark:group-data-[selected]:bg-neutral-800"
        closeDelay={180}
        delay={0}
        handle={previewHandle}
        payload={model.value}
        render={<div />}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate">{model.label}</span>
          <ProviderLabel
            className="text-neutral-500 text-xs dark:text-neutral-400"
            provider={model.provider}
          />
        </div>
        <ModelConfigurationBadge configuration={configuration} model={model} />
      </PreviewCard.Trigger>
    </Combobox.Item>
  );
});

function AsciiSpinner({ className }: { className?: string }) {
  const frames = [
    "[░░░]",
    "[▓░░]",
    "[▓▓░]",
    "[▓▓▓]",
    "[░▓▓]",
    "[░░▓]",
  ];
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={cn("font-mono text-neutral-400 select-none text-[11px] tracking-tighter shrink-0", className)}>
      {frames[frameIndex]}
    </span>
  );
}

export function ModelSelectorPrompt({
  className,
  configurations,
  defaultConfigurations = {},
  defaultPrompt = "",
  defaultValue,
  disabled = false,
  models = DEFAULT_LLM_MODELS,
  onConfigurationChange,
  onModelChange,
  onPromptChange,
  onSubmit,
  placeholder = "What do you want to do?",
  prompt,
  value,
}: ModelSelectorPromptProps = {}) {
  const fallbackModel = models[0] ?? DEFAULT_MODEL;
  const [uncontrolledModelValue, setUncontrolledModelValue] = useState(
    defaultValue ?? fallbackModel.value,
  );
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [uncontrolledConfigurations, setUncontrolledConfigurations] = useState<
    Record<string, ModelConfiguration>
  >(defaultConfigurations);
  const [uncontrolledPrompt, setUncontrolledPrompt] = useState(defaultPrompt);
  const selectedModelValue = value ?? uncontrolledModelValue;
  const selectedModel =
    models.find((model) => model.value === selectedModelValue) ?? fallbackModel;
  const modelConfigurations = configurations ?? uncontrolledConfigurations;
  const promptValue = prompt ?? uncontrolledPrompt;
  const previewHandle = useMemo(() => PreviewCard.createHandle<string>(), []);
  const [previewOpenCounter, setPreviewOpenCounter] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = () => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 800);
  };

  const [textareaHeight, setTextareaHeight] = useState(64);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = ""; // Reset to let motion/react animate it

    const minHeight = isExpanded ? 64 : 44;
    const maxHeight = 200;
    const nextHeight = Math.min(maxHeight, Math.max(minHeight, scrollHeight));

    setTextareaHeight(nextHeight);
  }, [promptValue, isExpanded]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Intentionally left blank so it never collapses
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trigger a brief scrollbar visibility indicator when the text overflows (load/type)
  useEffect(() => {
    const timer = setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const hasOverflow = textarea.scrollHeight > textarea.clientHeight;
      if (hasOverflow) {
        setIsScrolling(true);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 1500);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [promptValue]);

  const showToolbar = isExpanded || promptValue.length > 0;

  function updateModelConfiguration(
    modelValue: string,
    update: Partial<ModelConfiguration>,
  ) {
    const previous = modelConfigurations;
    const nextConfiguration = {
      ...getModelConfiguration(previous, modelValue),
      ...update,
    };
    const nextConfigurations = {
      ...previous,
      [modelValue]: nextConfiguration,
    };
    if (!configurations) {
      setUncontrolledConfigurations(nextConfigurations);
    }
    onConfigurationChange?.(modelValue, nextConfiguration, nextConfigurations);
  }
  function updateSelectedModel(model: LlmModel) {
    if (!value) {
      setUncontrolledModelValue(model.value);
    }
    onModelChange?.(model);
  }
  function updatePrompt(nextPrompt: string) {
    if (prompt === undefined) {
      setUncontrolledPrompt(nextPrompt);
    }
    onPromptChange?.(nextPrompt);
  }
  async function handleSubmit() {
    if (!promptValue.trim() || isSendingRef.current || disabled) return;
    isSendingRef.current = true;
    
    // Capture the prompt before clearing it
    const currentPrompt = promptValue;
    
    // Clear instantly from the UI and start wave animation
    updatePrompt("");
    setIsSending(true);

    let nextCount = messageCount + 1;
    if (nextCount > 40) {
      // Simulate real-time decrease when reaching limit
      nextCount = 35;
    }
    setMessageCount(nextCount);

    await onSubmit?.({
      configuration: getModelConfiguration(
        modelConfigurations,
        selectedModel.value,
      ),
      configurations: modelConfigurations,
      model: selectedModel,
      prompt: currentPrompt,
    });

    setTimeout(() => {
      isSendingRef.current = false;
      setIsSending(false);
    }, 1500);
  }
  function closeModelPreview() {
    previewHandle.close();
  }

  const contextWindowStr = selectedModel.contextWindow || "128k";
  const maxTokens = parseInt(contextWindowStr.replace(/\D/g, '')) * 1000;

  return (
    <div
      ref={containerRef}
      onClick={() => setIsExpanded(true)}
      className={cn(
        "relative mx-auto flex w-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 pointer-events-auto",
        className || "max-w-md",
      )}
    >
      <AnimatePresence>
        {isSending && <SendWave />}
      </AnimatePresence>

      <div className="relative z-20 w-full">
        <motion.textarea
          rows={1}
          ref={textareaRef}
          onScroll={handleScroll}
          onFocus={() => setIsExpanded(true)}
          className={cn(
            "w-full resize-none bg-transparent pl-5 pr-14 py-4 font-medium text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60 dark:placeholder:text-neutral-500 prompt-scrollbar overflow-auto",
            isScrolling && "is-scrolling",
            "text-neutral-900 dark:text-neutral-100"
          )}
          initial={false}
          animate={{ height: textareaHeight }}
          transition={{ duration: 0.3, type: "spring", stiffness: 350, damping: 25 }}
          disabled={disabled || isSending}
          onChange={(event) => updatePrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={placeholder}
          value={promptValue}
        />
      </div>
      <AnimatePresence initial={false}>
        {showToolbar && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 350, damping: 25 }}
            className="overflow-hidden"
          >
            <div className="flex w-full flex-row items-center justify-between gap-1 sm:gap-2 p-1 sm:p-2 pt-6">
              <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
                <Combobox.Root<LlmModel>
          autoHighlight
          isItemEqualToValue={(item, nextValue) =>
            item.value === nextValue.value
          }
          items={models}
          onInputValueChange={closeModelPreview}
          onValueChange={(nextModel) => {
            if (nextModel) {
              updateSelectedModel(nextModel);
            }
          }}
          onOpenChange={(open) => {
            if (open && isMobile) {
              setTimeout(() => {
                previewHandle.open(selectedModel.value);
              }, 150);
            }
          }}
          value={selectedModel}
        >
          <Combobox.Trigger
            aria-label="Select model"
            className="group flex min-w-0 items-center gap-1 sm:gap-1.5 rounded-lg border border-neutral-200 bg-white px-1.5 sm:px-2 py-1 sm:py-1.5 text-neutral-900 text-xs sm:text-sm transition-colors hover:bg-neutral-50 data-[popup-open]:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800 dark:data-[popup-open]:bg-neutral-800"
            disabled={disabled}
          >
            <Combobox.Value>
              {(model: LlmModel | null) =>
                model ? (
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1 sm:gap-1.5">
                      <ProviderIcon
                        className="size-3 sm:size-3.5 shrink-0"
                        provider={model.provider}
                      />
                      <span className="truncate">{model.label}</span>
                    </span>
                    <ModelConfigurationBadge
                      configuration={getModelConfiguration(
                        modelConfigurations,
                        model.value,
                      )}
                      model={model}
                    />
                  </span>
                ) : (
                  <span>Select model</span>
                )
              }
            </Combobox.Value>
            <Combobox.Icon className="text-neutral-500 dark:text-neutral-400">
              <CaretDownIcon size={14} weight="bold" className="transition-transform duration-200 ease-in-out group-data-[popup-open]:rotate-180" />
            </Combobox.Icon>
          </Combobox.Trigger>
          <Combobox.Portal>
            <Combobox.Positioner align="start" side="top" sideOffset={4} className="z-[9999]">
              <Combobox.Popup
                id="model-combobox-popup"
                aria-label="Select model"
                className="w-60 rounded-xl border border-neutral-200 bg-white shadow-lg outline-none dark:border-neutral-800 dark:bg-neutral-900"
              >
                <PreviewCard.Root<string>
                  handle={previewHandle}
                  onOpenChange={(open) => {
                    if (open) {
                      setPreviewOpenCounter((c) => c + 1);
                    }
                  }}
                >
                  {({ payload }) => {
                    return (
                    <>
                    {/* Mobile: render details inline above search */}
                      {isMobile && payload ? (
                        <div className="border-b border-neutral-100 dark:border-neutral-800 transition-all duration-200 ease-out animate-in fade-in-0 slide-in-from-top-2">
                          <ModelPreviewPanel
                            key={`${payload}-${previewOpenCounter}`}
                            configuration={getModelConfiguration(
                              modelConfigurations,
                              payload,
                            )}
                            model={models.find((m) => m.value === payload) ?? fallbackModel}
                            onConfigurationChange={(update) =>
                              updateModelConfiguration(payload, update)
                            }
                          />
                        </div>
                      ) : null}
                      <Combobox.InputGroup className="flex items-center gap-1.5 rounded-none border-0 border-b border-neutral-100 bg-transparent px-2 dark:border-neutral-800">
                        <Combobox.Input
                          className="w-full bg-transparent px-0 py-2 text-sm outline-none placeholder:text-neutral-400 dark:text-neutral-100"
                          onFocus={closeModelPreview}
                          placeholder="Search models..."
                        />
                        <MagnifyingGlassIcon
                          aria-hidden="true"
                          className="shrink-0 text-neutral-400"
                          size={14}
                          weight="bold"
                        />
                      </Combobox.InputGroup>
                      <Combobox.Empty>
                        <div className="flex flex-col gap-1 px-2 py-2 text-center font-medium text-neutral-500 text-xs">
                          No models found
                          <div className="text-pretty text-center text-neutral-400 text-xs">
                            Maybe try a different search.
                          </div>
                        </div>
                      </Combobox.Empty>
                      <ModelListWithScrollFade>
                        {(model: LlmModel) => (
                          <ModelComboboxItem
                            configuration={getModelConfiguration(
                              modelConfigurations,
                              model.value,
                            )}
                            key={model.value}
                            model={model}
                            previewHandle={previewHandle}
                          />
                        )}
                      </ModelListWithScrollFade>
                      {/* Desktop: render details as floating portal to the right */}
                      {!isMobile ? (
                      <PreviewCard.Portal keepMounted>
                        <PreviewCard.Positioner
                          align="center"
                          className="z-[9999]"
                          side="right"
                          sideOffset={8}
                        >
                          <PreviewCard.Popup 
                            id="model-preview-popup" 
                            className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg outline-none dark:border-neutral-800 dark:bg-neutral-900 transition-all duration-200 ease-out data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:-translate-y-2 data-[ending-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:translate-y-2"
                          >
                            {payload ? (
                              <ModelPreviewPanel
                                key={`${payload}-${previewOpenCounter}`}
                                configuration={getModelConfiguration(
                                  modelConfigurations,
                                  payload,
                                )}
                                model={models.find((m) => m.value === payload) ?? fallbackModel}
                                onConfigurationChange={(update) =>
                                  updateModelConfiguration(payload, update)
                                }
                              />
                            ) : null}
                          </PreviewCard.Popup>
                        </PreviewCard.Positioner>
                      </PreviewCard.Portal>
                      ) : null}
                    </>
                    );
                  }}
                </PreviewCard.Root>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
        <Context
          maxTokens={40}
          modelId={`${selectedModel.provider}: ${selectedModel.label}`}
          usage={{
            promptTokens: messageCount,
            totalTokens: messageCount,
          } as any}
          usedTokens={messageCount}
        >
          <ContextTrigger />
          <ContextContent>
            <ContextContentHeader />
            <ContextContentFooter />
          </ContextContent>
        </Context>
      </div>
        <Button
          disabled={disabled || isSending}
          onClick={() => {
            void handleSubmit();
            setIsExpanded(false);
          }}
          type="button"
          className="shrink-0 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 relative overflow-hidden w-20 sm:w-24 h-8 sm:h-9 text-xs sm:text-sm flex items-center justify-center px-2 sm:px-4"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {!(isSending || disabled) ? (
              <motion.div
                key="send"
                initial={{ y: -20, opacity: 0, filter: "blur(5px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: 20, opacity: 0, filter: "blur(5px)" }}
                transition={{ duration: 0.25, type: "spring", bounce: 0 }}
                className="flex items-center gap-1.5"
              >
                <PaperPlaneTiltIcon size={14} weight="fill" />
                <span>Send</span>
              </motion.div>
            ) : (
              <motion.div
                key="wait"
                initial={{ y: -20, opacity: 0, filter: "blur(5px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: 20, opacity: 0, filter: "blur(5px)" }}
                transition={{ duration: 0.25, type: "spring", bounce: 0 }}
                className="flex items-center gap-1.5"
              >
                <AsciiSpinner />
                <span className="bg-[linear-gradient(110deg,#939393,45%,#fff,55%,#939393)] bg-[length:200%_100%] animate-shimmer text-transparent bg-clip-text font-medium">Wait...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ModelSelectorPrompt;
