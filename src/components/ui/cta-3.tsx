import { ArrowRightIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CallToActionProps {
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function CallToAction({
  title = "Let your plans shape the future.",
  description = "Start your free trial today. No credit card required.",
  action = (
    <div className="flex items-center justify-center gap-2">
      <Button variant="outline">Contact Sales</Button>
      <Button>
        Get Started <ArrowRightIcon className="size-4 ml-1" />
      </Button>
    </div>
  )
}: CallToActionProps) {
  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col justify-between gap-y-6 border-y border-slate-200 dark:border-slate-800 bg-[radial-gradient(35%_80%_at_25%_0%,rgba(0,0,0,0.03),transparent)] dark:bg-[radial-gradient(35%_80%_at_25%_0%,rgba(255,255,255,0.05),transparent)] px-4 py-8 overflow-visible">
      <PlusIcon
        className="absolute top-[-12.5px] left-[-11.5px] z-10 size-6 text-slate-300 dark:text-slate-700"
        strokeWidth={1}
      />
      <PlusIcon
        className="absolute top-[-12.5px] right-[-11.5px] z-10 size-6 text-slate-300 dark:text-slate-700"
        strokeWidth={1}
      />
      <PlusIcon
        className="absolute bottom-[-12.5px] left-[-11.5px] z-10 size-6 text-slate-300 dark:text-slate-700"
        strokeWidth={1}
      />
      <PlusIcon
        className="absolute right-[-11.5px] bottom-[-12.5px] z-10 size-6 text-slate-300 dark:text-slate-700"
        strokeWidth={1}
      />

      <div className="-inset-y-6 pointer-events-none absolute left-0 w-px border-l border-slate-200 dark:border-slate-800" />
      <div className="-inset-y-6 pointer-events-none absolute right-0 w-px border-r border-slate-200 dark:border-slate-800" />

      <div className="-z-10 absolute top-0 left-1/2 h-full border-l border-dashed border-slate-200 dark:border-slate-800" />

      <div className="space-y-2 z-10 relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-transparent">
        <h2 className="text-center font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">
          {title}
        </h2>
        <p className="text-center text-slate-600 dark:text-slate-400 text-[13px] max-w-lg mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex items-center justify-center z-10">
        {action}
      </div>
    </div>
  );
}
