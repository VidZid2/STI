"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Flame, 
  Wrench, 
  LayoutTemplate, 
  Users, 
  Target, 
  BookOpen, 
  CloudUpload, 
  BotMessageSquare 
} from "lucide-react";

const featuresData = [
  {
    id: "item-1",
    icon: Flame,
    title: "Day Streak",
    subtitle: "Build consistent habits",
    content: "Stay motivated by tracking your consecutive study days. Build habits that last and keep pushing your personal records higher.",
  },
  {
    id: "item-2",
    icon: Wrench,
    title: "Student Tools",
    subtitle: "Maximize your productivity",
    content: "Essential utilities and resources right at your fingertips to maximize your productivity and learning efficiency.",
  },
  {
    id: "item-3",
    icon: LayoutTemplate,
    title: "Quick View Widgets",
    subtitle: "Dashboard upgraded",
    content: "Your dashboard, upgraded. Access everything you need at a glance without ever having to switch tabs or pages.",
  },
  {
    id: "item-4",
    icon: Users,
    title: "Group Page",
    subtitle: "Collaborate with peers",
    content: "Seamlessly collaborate with your peers, manage group assignments effortlessly, and communicate in real-time.",
  },
  {
    id: "item-5",
    icon: Target,
    title: "Revamp Goals System",
    subtitle: "Set and crush targets",
    content: "Set, track, and crush your academic goals with our entirely new goal-setting engine built for student success.",
  },
  {
    id: "item-6",
    icon: BookOpen,
    title: "Revamp Course System",
    subtitle: "Distraction-free learning",
    content: "A streamlined, distraction-free view for your modules, lessons, and quizzes. Focus entirely on your learning material.",
  },
  {
    id: "item-7",
    icon: CloudUpload,
    title: "Upload & Deleting System",
    subtitle: "Manage files easily",
    content: "Manage your files with ease using our lightning-fast, highly reliable cloud upload and deletion interface.",
  },
  {
    id: "item-8",
    icon: BotMessageSquare,
    title: "Support & Helper AI",
    subtitle: "Intelligent assistance",
    content: "Stuck on a problem? Ask our built-in intelligent AI assistant for immediate, step-by-step help and guidance.",
  },
];

export function WelcomeFeatures() {
  // Split into two columns for desktop
  const col1 = featuresData.slice(0, 4);
  const col2 = featuresData.slice(4, 8);

  const AccordionList = ({ items }: { items: typeof featuresData }) => (
    <Accordion type="multiple" className="w-full rounded-2xl bg-white dark:bg-[#18181b] p-2 shadow-sm border border-slate-100 dark:border-slate-800/60">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          className="group/item border-b border-slate-100 dark:border-slate-800/60 last:border-none"
        >
          <AccordionTrigger className="flex w-full items-center justify-between py-3 px-3 hover:no-underline hover:bg-slate-50 dark:hover:bg-[#27272a]/60 rounded-xl transition-colors data-[state=open]:bg-slate-50 dark:data-[state=open]:bg-[#27272a]/60">
            <div className="flex items-center gap-4 text-left">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-all duration-300 ease-out group-hover/item:scale-110 group-hover/item:-rotate-6 group-hover/item:shadow-md">
                <item.icon className="size-5" strokeWidth={2.5} />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-[15px] leading-5 text-slate-800 dark:text-slate-100">{item.title}</span>
                <span className="font-normal text-sm leading-5 text-slate-500 dark:text-slate-400">{item.subtitle}</span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-4 pt-1">
            <div className="pl-[60px] pr-2">
              <p className="text-slate-600 dark:text-slate-400/80 text-[14px] leading-relaxed">
                {item.content}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );

  return (
    <div className="w-full flex flex-col pt-2 sm:pt-4">
      <div className="text-center space-y-2 mb-6 sm:mb-8 shrink-0 px-4">
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Everything New</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
          We've packed this update with powerful tools to transform how you study. Explore the new features below.
        </p>
      </div>

      <div className="w-full px-1 sm:px-2 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
          <AccordionList items={col1} />
          <AccordionList items={col2} />
        </div>
      </div>
    </div>
  );
}
