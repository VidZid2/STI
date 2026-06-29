import { ChevronRight } from "lucide-react";

export interface DockMenuRowProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}

export function DockMenuRow({ icon: Icon, label, onClick }: DockMenuRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        <span className="text-slate-700 dark:text-slate-200">{label}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
    </button>
  );
}

export function DockMenu({ rows }: { rows: DockMenuRowProps[] }) {
  return (
    <div className="flex flex-col gap-1 w-full min-w-[260px] max-h-[50vh] overflow-y-auto overscroll-contain no-scrollbar">
      {rows.map((row, index) => (
        <DockMenuRow key={index} {...row} />
      ))}
    </div>
  );
}
