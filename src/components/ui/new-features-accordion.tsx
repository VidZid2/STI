import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { 
  Flame, 
  PenTool, 
  LayoutDashboard, 
  Users, 
  Target, 
  BookOpen, 
  UploadCloud, 
  Trash2, 
  Bot,
  Plus
} from "lucide-react";

const newFeatures = [
  {
    id: "streak",
    icon: Flame,
    title: "Day Streak",
    sub: "Build consistent learning habits",
    content: "Stay motivated by tracking your consecutive study days. Build habits that last and keep pushing your personal records higher. Your streak represents your dedication to continuous learning.",
  },
  {
    id: "tools",
    icon: PenTool,
    title: "Student Tools",
    sub: "Everything you need in one place",
    content: "Access a comprehensive suite of student tools designed to make studying easier. From calculators to quick-reference guides, everything is just a click away.",
  },
  {
    id: "widgets",
    icon: LayoutDashboard,
    title: "Quick View Widgets",
    sub: "Your dashboard, upgraded",
    content: "Live weather, dynamic study goals, and upcoming deadlines right on your dashboard. Get a complete overview of your academic life at a single glance without navigating away.",
  },
  {
    id: "group",
    icon: Users,
    title: "Group Page",
    sub: "Collaborate with your peers",
    content: "Connect with classmates in dedicated group pages. Share resources, discuss topics, and work together on group projects in a seamless, collaborative environment.",
  },
  {
    id: "goals",
    icon: Target,
    title: "Revamped Goals System",
    sub: "Set and crush your targets",
    content: "We've completely overhauled the goals system. Set specific, measurable targets for your courses and track your progress visually as you work towards achieving them.",
  },
  {
    id: "course",
    icon: BookOpen,
    title: "Revamped Course System",
    sub: "A better way to learn",
    content: "Experience a more intuitive and structured course layout. Navigate through modules effortlessly, track your completion status, and access materials faster than ever.",
  },
  {
    id: "upload",
    icon: UploadCloud,
    title: "Upload System",
    sub: "Submit assignments with ease",
    content: "Our new upload system is faster and more reliable. Support for more file types, drag-and-drop functionality, and visual progress indicators make submitting work a breeze.",
  },
  {
    id: "delete",
    icon: Trash2,
    title: "Deleting System",
    sub: "Manage your files better",
    content: "Easily clean up your workspace with our improved deleting system. Safely remove old files and submissions with clear confirmation prompts to prevent accidental data loss.",
  },
  {
    id: "ai",
    icon: Bot,
    title: "Support & Helper AI",
    sub: "24/7 intelligent assistance",
    content: "Meet your new AI assistant! Get instant answers to common questions, help with navigating the platform, and intelligent study suggestions available around the clock.",
  },
];

export function NewFeaturesAccordion() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 px-2 sm:px-0 pb-6">
      <div className="text-center space-y-2 mb-6">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Exciting New Features</h3>
        <p className="text-slate-500 dark:text-slate-400">Discover everything we've added to boost your productivity.</p>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue="streak">
        {newFeatures.map((item) => (
          <AccordionItem value={item.id} key={item.id} className="py-2 border-b border-slate-200 dark:border-slate-800 last:border-b-0">
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-2 text-left text-[15px] font-semibold leading-6 transition-all [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0 [&[data-state=open]>svg]:rotate-180 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
                <span className="flex items-center gap-3 sm:gap-4">
                  <span
                    className="flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-sm transition-transform duration-300 hover:scale-105"
                    aria-hidden="true"
                  >
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6 opacity-70 text-slate-700 dark:text-slate-300" strokeWidth={2} />
                  </span>
                  <span className="flex flex-col space-y-0.5">
                    <span className="text-base sm:text-lg text-slate-900 dark:text-slate-100">{item.title}</span>
                    {item.sub && <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400">{item.sub}</span>}
                  </span>
                </span>
                <Plus
                  size={18}
                  strokeWidth={2}
                  className="shrink-0 opacity-60 transition-transform duration-200 text-slate-500 dark:text-slate-400"
                  aria-hidden="true"
                />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionContent className="relative pb-4 sm:pb-2 pl-[52px] sm:ps-[4.5rem] pr-2 sm:pr-4">
              {/* Timeline dashed line for mobile */}
              <div className="w-px h-full absolute left-5 inset-y-0 border-l-2 border-dashed border-slate-200 dark:border-slate-800 md:hidden" />
              
              <div className="relative z-10">
                <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                  {item.content}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
