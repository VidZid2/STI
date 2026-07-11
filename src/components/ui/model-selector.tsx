// @ts-nocheck
"use client";

import { Combobox } from "@base-ui/react/combobox";
import { PreviewCard } from "@base-ui/react/preview-card";
import {
  BrainIcon,
  CaretDownIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  PaperPlaneTiltIcon,
  Info,
} from "@phosphor-icons/react";
import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

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
    value: "owl-ai",
    label: "Owl AI",
    provider: "eLMS",
    description: "Balanced for creative and everyday tasks.",
    contextWindow: "1M tokens",
    inputPrice: "$1.00 / 1M",
    outputPrice: "$2.00 / 1M",
    hasSpeedConfiguration: true,
    metrics: { intelligence: 9, speed: 8, context: 10, cost: 3 },
  },
];

const DEFAULT_MODEL =
  DEFAULT_LLM_MODELS.find((model) => model.value === "owl-ai") ??
  DEFAULT_LLM_MODELS[0];

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

const DEFAULT_MODEL_CONFIGURATION: ModelConfiguration = {
  reasoning: "medium",
  speed: "standard",
};

export function getModelConfiguration(
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
  return Math.min(10, Math.max(1, Math.round(value)));
}

// Inline provider marks (replacing the original PNG logos).
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
  return null;
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
  const showFast =
    model.hasSpeedConfiguration && configuration.speed === "fast";
  if (!showReasoning && !showFast) {
    return null;
  }
  const badgeClassName =
    "inline-flex items-center gap-0.5 rounded-md bg-neutral-100 dark:bg-zinc-800 px-1 py-0.5 text-neutral-500 dark:text-zinc-400 text-[10px] group-data-[selected]:bg-neutral-200 dark:group-data-[selected]:bg-zinc-700";
  return (
    <div className="flex shrink-0 items-center gap-1">
      <AnimatePresence>
        {showReasoning && (
          <motion.span
            layout
            initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className={badgeClassName}
          >
            <BrainIcon className="text-neutral-500 dark:text-zinc-400" size={11} weight="fill" />
            {REASONING_LABELS[configuration.reasoning]}
          </motion.span>
        )}
        {showFast && (
          <motion.span
            layout
            initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className={badgeClassName}
          >
            <LightningIcon className="text-amber-500" size={11} weight="fill" />
            Fast
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

// Removed getSegmentColor since all segments follow the same temporal animation

// A single segment that grows up from the bottom on mount (so newly-filled
// segments animate in when the value increases, and all animate on model swap).
function GrowSegment({ delay }: { delay: number }) {
  return (
    <motion.div
      className="h-full w-full origin-bottom rounded-sm"
      initial={{ scaleY: 0, backgroundColor: "#e5484d" }}
      animate={{ 
        scaleY: 1, 
        backgroundColor: ["#e5484d", "#f76b15", "#eab308", "#46a758"] 
      }}
      transition={{ 
        duration: 0.25, 
        ease: "easeOut", 
        delay: delay / 1000 
      }}
    />
  );
}

function MetricBar({
  label,
  value,
  info,
  invert = false,
  animationKey,
}: {
  label: string;
  value: number;
  info?: string;
  invert?: boolean;
  animationKey: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono font-medium text-[10px] text-neutral-400 uppercase leading-none">
          {label}
        </span>
        {info ? (
          <span
            className="cursor-help flex items-center text-neutral-400 leading-none"
            title={info}
          >
            <Info size={12} weight="fill" />
          </span>
        ) : null}
      </div>
      <div
        aria-label={`${label}: ${value} out of 10`}
        className="grid grid-cols-10 gap-1"
        key={animationKey}
        role="img"
      >
        {Array.from({ length: 10 }, (_, index) => (
          <div
            className="h-3 overflow-hidden rounded-sm bg-neutral-100 dark:bg-zinc-800"
            key={index}
          >
            {index < value ? (
              <GrowSegment delay={index * 40} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function SegmentedRadio<TValue extends string>({
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
              "flex-1 flex items-center justify-center rounded-md px-2 h-7 min-h-0 py-0 text-xs transition-colors",
              checked
                ? "bg-neutral-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                : "bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-zinc-400 hover:bg-neutral-200 dark:hover:bg-zinc-700 hover:text-neutral-900 dark:hover:text-zinc-100",
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

function ModelPreviewPanel({
  model,
  configuration,
  onConfigurationChange,
}: {
  model: LlmModel;
  configuration: ModelConfiguration;
  onConfigurationChange: (update: Partial<ModelConfiguration>) => void;
}) {
  const { reasoning, speed } = configuration;
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
    <div className="flex w-56 flex-col divide-y divide-neutral-100 dark:divide-zinc-800">
      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-neutral-900 dark:text-zinc-100 text-sm">{model.label}</p>
          <ProviderLabel
            className="text-neutral-500 dark:text-zinc-400 text-xs"
            provider={model.provider}
          />
        </div>
        <p className="text-pretty text-neutral-500 dark:text-zinc-400 text-xs leading-4">
          {model.description}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
          <MetricBar
            animationKey={`${model.value}-${reasoning}-${speed}`}
            label="Intelligence"
            value={adjustedMetrics.intelligence}
          />
          <MetricBar
            animationKey={`${model.value}-${reasoning}-${speed}`}
            label="Speed"
            value={adjustedMetrics.speed}
          />
          <MetricBar
            animationKey={`${model.value}-${reasoning}-${speed}`}
            info={`${model.contextWindow} context window`}
            label="Context"
            value={adjustedMetrics.context}
          />
          <MetricBar
            animationKey={`${model.value}-${reasoning}-${speed}`}
            info={`${model.inputPrice} input · ${model.outputPrice} output`}
            invert
            label="Cost"
            value={adjustedMetrics.cost}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 p-3">
        <p className="font-mono font-semibold text-[10px] text-neutral-500 dark:text-zinc-400 uppercase leading-none">
          Configuration
        </p>
        <div className="flex flex-col gap-2">
          <p className="text-neutral-500 dark:text-zinc-400 text-xs leading-none">Reasoning</p>
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
            <p className="text-neutral-500 dark:text-zinc-400 text-xs leading-none">Speed</p>
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
}

function ModelListWithScrollFade({ children }: { children: ReactNode | ((model: LlmModel) => ReactNode) }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [showBottomFade, setShowBottomFade] = useState(false);
  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    function updateBottomFade() {
      const el = listRef.current;
      if (!el) {
        return;
      }
      const { scrollTop, scrollHeight, clientHeight } = el;
      setShowBottomFade(scrollHeight - scrollTop - clientHeight > 4);
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
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-white dark:from-[#18181b] to-transparent transition-opacity duration-150",
          showBottomFade ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

function ModelComboboxItem({
  model,
  configuration,
  previewHandle,
}: {
  model: LlmModel;
  configuration: ModelConfiguration;
  previewHandle: PreviewCard.Handle<LlmModel>;
}) {
  return (
    <Combobox.Item
      className="group w-full p-0 text-neutral-700 dark:text-zinc-300 data-[selected]:text-neutral-900 dark:data-[selected]:text-zinc-100"
      value={model}
    >
      <PreviewCard.Trigger
        className="flex w-full items-start gap-2 rounded-md px-1.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-zinc-800 group-data-[selected]:bg-neutral-100 dark:group-data-[selected]:bg-zinc-800"
        closeDelay={180}
        delay={80}
        handle={previewHandle}
        payload={model}
        render={<div />}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-left">{model.label}</span>
          <ProviderLabel
            className="text-neutral-500 dark:text-zinc-400 text-xs"
            provider={model.provider}
          />
        </div>
        <ModelConfigurationBadge configuration={configuration} model={model} />
      </PreviewCard.Trigger>
    </Combobox.Item>
  );
}

export type ModelSelectorProps = {
  className?: string;
  configurations?: Record<string, ModelConfiguration>;
  defaultConfigurations?: Record<string, ModelConfiguration>;
  defaultValue?: string;
  disabled?: boolean;
  models?: readonly LlmModel[];
  onConfigurationChange?: (
    modelValue: string,
    configuration: ModelConfiguration,
    configurations: Record<string, ModelConfiguration>,
  ) => void;
  onModelChange?: (model: LlmModel) => void;
  value?: string;
};

export function ModelSelector({
  className,
  configurations,
  defaultConfigurations = {},
  defaultValue,
  disabled = false,
  models = DEFAULT_LLM_MODELS,
  onConfigurationChange,
  onModelChange,
  value,
}: ModelSelectorProps = {}) {
  const fallbackModel = models[0] ?? DEFAULT_MODEL;
  const [uncontrolledModelValue, setUncontrolledModelValue] = useState(
    defaultValue ?? fallbackModel.value,
  );
  const [uncontrolledConfigurations, setUncontrolledConfigurations] = useState<
    Record<string, ModelConfiguration>
  >(defaultConfigurations);
  
  const selectedModelValue = value ?? uncontrolledModelValue;
  const selectedModel =
    models.find((model) => model.value === selectedModelValue) ?? fallbackModel;
  const modelConfigurations = configurations ?? uncontrolledConfigurations;
  const previewHandle = useMemo(() => PreviewCard.createHandle<LlmModel>(), []);

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
  
  function closeModelPreview() {
    previewHandle.close();
  }

  return (
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
      value={selectedModel}
    >
      <Combobox.Trigger
        render={<motion.button layout transition={{ type: "spring", bounce: 0, duration: 0.4 }} />}
        aria-label="Select model"
        className={cn("flex items-center gap-1.5 rounded-lg border-none bg-transparent px-2 py-1.5 text-neutral-900 dark:text-zinc-100 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-zinc-800 data-[popup-open]:bg-neutral-50 dark:data-[popup-open]:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60", className)}
        disabled={disabled}
      >
        <Combobox.Value>
          {(model: LlmModel | null) =>
            model ? (
              <motion.span layout className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <motion.span layout className="flex min-w-0 items-center gap-1.5">
                  <ProviderIcon
                    className="size-3.5"
                    provider={model.provider}
                  />
                  <span className="truncate">{model.label}</span>
                  </motion.span>
                <ModelConfigurationBadge
                  configuration={getModelConfiguration(
                    modelConfigurations,
                    model.value,
                  )}
                  model={model}
                />
              </motion.span>
            ) : (
              <span>Select model</span>
            )
          }
        </Combobox.Value>
        <motion.span layout className="flex items-center">
          <Combobox.Icon className="text-neutral-500 dark:text-zinc-400">
            <CaretDownIcon size={14} weight="bold" />
          </Combobox.Icon>
        </motion.span>
      </Combobox.Trigger>
      
      <Combobox.Portal>
        <Combobox.Positioner align="start" side="top" sideOffset={4} className="z-[99999]">
          <Combobox.Popup
            aria-label="Select model"
            className="w-60 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] shadow-lg outline-none z-[99999] transition-all duration-200 ease-out origin-top data-[starting-style]:scale-95 data-[ending-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-[starting-style]:-translate-y-2 data-[ending-style]:-translate-y-2"
          >
            <PreviewCard.Root<LlmModel> handle={previewHandle}>
              {({ payload }) => {
                const activeModel = payload ?? selectedModel;
                return (
                <div className="flex flex-col">
                  <ModelPreviewPanel
                    configuration={getModelConfiguration(
                      modelConfigurations,
                      activeModel.value,
                    )}
                    model={activeModel}
                    onConfigurationChange={(update) =>
                      updateModelConfiguration(activeModel.value, update)
                    }
                  />
                  <div className="h-[1px] bg-neutral-200 dark:bg-zinc-800" />
                  <Combobox.InputGroup className="flex items-center gap-1.5 rounded-none border-0 border-b border-neutral-100 dark:border-zinc-800 bg-transparent px-2">
                    <Combobox.Input
                      className="w-full bg-transparent px-0 py-2 text-sm outline-none placeholder:text-neutral-400 dark:text-zinc-100"
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
                </div>
                );
              }}
            </PreviewCard.Root>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
