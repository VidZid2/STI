import { cn } from "@/lib/utils";
import { MagicCard } from "@/components/ui/magic-card";
import { useTheme } from "next-themes";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  background,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  background?: React.ReactNode;
}) => {
  const { theme } = useTheme();

  return (
    <MagicCard
      className={cn(
        "group/bento shadow-input row-span-1 rounded-xl border border-transparent bg-white transition duration-200 hover:shadow-xl relative overflow-hidden",
        className,
      )}
      gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}
      gradientFrom="#eab308"
      gradientTo="#3b82f6"
    >
      <div className="relative flex flex-col justify-between space-y-4 p-4 h-full w-full pointer-events-none">
        {background}
        <div className="pointer-events-auto flex flex-1 w-full min-h-0">
          {header}
        </div>
        <div className="transition duration-200 group-hover/bento:translate-x-2 relative z-10 pointer-events-auto">
          {icon}
          <div className="mt-2 mb-2 font-sans font-bold text-neutral-600">
            {title}
          </div>
          <div className="font-sans text-xs font-normal text-neutral-600">
            {description}
          </div>
        </div>
      </div>
    </MagicCard>
  );
};
