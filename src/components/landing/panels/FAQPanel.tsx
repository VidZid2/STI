import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DownloadCloud, 
  Key, 
  Award, 
  Clock, 
  Smartphone, 
  HelpCircle
} from 'lucide-react';
import { LinkPreview } from '../../ui/link-preview';

interface FAQPanelProps {
  isActive: boolean;
}

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Can I view course materials without an active internet connection?",
    answer: "Yes! Download modules and readings on the eLMS mobile app for offline access. Progress syncs automatically when you're back online.",
    icon: <DownloadCloud className="w-5 h-5 text-blue-600" />
  },
  {
    question: "I forgot my password or cannot log in. What should I do?",
    answer: "Log in using your STI Microsoft 365 credentials. If you're locked out, use the self-service reset portal or contact your IT Helpdesk.",
    icon: <Key className="w-5 h-5 text-blue-600" />
  },
  {
    question: "When and where can I view my grades and exam feedback?",
    answer: "Grades are published instantly on the 'Grades' tab of each course once evaluated. Check your notification feed for real-time updates.",
    icon: <Award className="w-5 h-5 text-blue-600" />
  },
  {
    question: "Can I submit tasks past the deadline, and are there late penalties?",
    answer: "Late submissions depend on your instructor's guidelines and may incur deductions. Contact your professor immediately for valid circumstances.",
    icon: <Clock className="w-5 h-5 text-blue-600" />
  },
  {
    question: "Is there an official mobile app for learning on the go?",
    answer: "Yes! Search for 'STI eLMS' on the App Store or Google Play. Log in with your student email (@u.sti.edu.ph) to access features on the go.",
    icon: <Smartphone className="w-5 h-5 text-blue-600" />
  },
  {
    question: "What if I experience bugs, loading errors, or system issues?",
    answer: "For technical glitches, submit a ticket via the eLMS Help Center or email your local campus tech support team at support@sti.edu.",
    icon: <HelpCircle className="w-5 h-5 text-blue-600" />
  }
];

const FAQPanel: React.FC<FAQPanelProps> = ({ isActive }) => {
  return (
    <section className={`hz-panel panel-faq bg-white ${isActive ? 'panel-active' : ''}`}>
      <div className="hz-panel-inner w-full h-full flex flex-col py-6 md:py-10 px-4 sm:px-6 lg:px-8 relative z-10 mx-auto max-w-7xl justify-between">
        
        {/* Header Section */}
        <div className="w-full mt-6 md:mt-10 flex-shrink-0 text-left px-4 md:px-0">
          <AnimatePresence>
            {isActive && (
              <>
                <motion.h2 
                  className="text-3xl md:text-4xl font-semibold text-zinc-900 tracking-tight"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  FAQs
                </motion.h2>
                <motion.p 
                  className="mt-2 md:mt-3 text-[16px] md:text-[18px] text-zinc-600 max-w-3xl"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  Everything you need to know about the platform. Can't find the answer you're looking for? Please <LinkPreview url="https://helpdesk.sti.edu/User/Login?ReturnUrl=%2f" className="underline text-blue-600 hover:text-blue-700 transition-colors">chat to our friendly team</LinkPreview>.
                </motion.p>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* 3x2 Grid Section */}
        <div className="w-full flex-grow flex items-center justify-center py-4 md:py-6 px-4 md:px-0 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 md:gap-y-10 w-full overflow-y-auto overflow-x-hidden md:overflow-visible pr-2 md:pr-0 pb-2 md:pb-0 scrollbar-hide">
            <AnimatePresence>
              {isActive && FAQ_ITEMS.map((item, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col justify-start"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{
                    type: "spring",
                    stiffness: 240,
                    damping: 22,
                    mass: 0.8,
                    delay: 0.1 + index * 0.05,
                  }}
                >
                  {/* Icon container */}
                  <div className="w-10 h-10 rounded-[8px] border border-zinc-200 flex items-center justify-center mb-3 bg-white shadow-sm flex-shrink-0">
                    {item.icon}
                  </div>
                  <h3 className="text-[18px] md:text-[20px] font-semibold text-zinc-900 mb-2 leading-snug">
                    {item.question}
                  </h3>
                  <p className="text-[15px] md:text-[16px] text-zinc-600 leading-relaxed font-normal">
                    {item.answer}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Contact Banner */}
        <div className="w-full flex-shrink-0 px-4 md:px-0 mb-4 md:mb-6">
          <AnimatePresence>
            {isActive && (
              <motion.div 
                className="w-full p-5 md:p-6 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="text-left">
                  <h4 className="text-[20px] md:text-[22px] font-semibold text-zinc-900 mb-1">Still have questions?</h4>
                  <p className="text-[16px] md:text-[18px] text-zinc-600">
                    Can't find the answer you're looking for? Please chat to our friendly team.
                  </p>
                </div>
                
                <LinkPreview 
                  url="https://helpdesk.sti.edu/User/Login?ReturnUrl=%2f" 
                  className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[16px] md:text-[17px] px-6 py-3 rounded-lg shadow-sm transition-all duration-300 flex-shrink-0"
                >
                  Get in touch
                </LinkPreview>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

export default FAQPanel;
