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
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
} from '@/components/animate-ui/components/headless/accordion';

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
              <>
                <motion.h2 
                  className="text-3xl md:text-4xl font-semibold text-zinc-900 tracking-tight"
                  initial={{ opacity: 0, y: -20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  FAQs
                </motion.h2>
                <motion.div 
                  className="mt-2 md:mt-3 text-[16px] md:text-[18px] text-zinc-600 max-w-3xl"
                  initial={{ opacity: 0, y: -20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  Everything you need to know about the platform. Can't find the answer you're looking for? Please <LinkPreview url="https://helpdesk.sti.edu/User/Login?ReturnUrl=%2f" className="underline text-blue-600 hover:text-blue-700 transition-colors">chat to our friendly team</LinkPreview>.
                </motion.div>
              </>
          </AnimatePresence>
        </div>

        {/* 3x2 Grid Section (PC/Desktop Only) */}
        <div className="hidden lg:flex w-full flex-grow items-center justify-center py-6 px-0 min-h-0">
          <div className="grid grid-cols-3 gap-x-6 gap-y-10 w-full">
            <AnimatePresence>
              {FAQ_ITEMS.map((item, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col justify-start"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    type: "spring",
                    stiffness: 240,
                    damping: 22,
                    mass: 0.8,
                    delay: index * 0.05,
                  }}
                >
                  {/* Icon container */}
                  <div className="w-10 h-10 rounded-[8px] border border-zinc-200 flex items-center justify-center mb-3 bg-white shadow-sm flex-shrink-0">
                    {item.icon}
                  </div>
                  <h3 className="text-[20px] font-semibold text-zinc-900 mb-2 leading-snug">
                    {item.question}
                  </h3>
                  <p className="text-[16px] text-zinc-600 leading-relaxed font-normal">
                    {item.answer}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Accordion Section (Mobile/Tablet Only) */}
        <div className="flex lg:hidden w-full flex-grow flex-col items-center justify-start py-4 px-4 min-h-0">
          <Accordion className="w-full">
            <AnimatePresence>
              {FAQ_ITEMS.map((item, index) => (
                <motion.div
                  key={`acc-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{
                    type: "spring",
                    stiffness: 240,
                    damping: 22,
                    mass: 0.8,
                    delay: index * 0.05,
                  }}
                >
                  <AccordionItem>
                    <AccordionButton showArrow={true} className="py-4">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-[6px] border border-zinc-200 flex items-center justify-center bg-white shadow-sm flex-shrink-0">
                          {React.cloneElement(item.icon as React.ReactElement<any>, { className: "w-4 h-4 text-blue-600" })}
                        </div>
                        <span className="font-semibold text-zinc-900 text-[15px] sm:text-[16px] leading-snug pr-2">{item.question}</span>
                      </div>
                    </AccordionButton>
                    <AccordionPanel keepRendered={false}>
                      <p className="text-[14px] sm:text-[15px] text-zinc-600 leading-relaxed font-normal pt-1 pb-5 pl-11 pr-2">
                        {item.answer}
                      </p>
                    </AccordionPanel>
                  </AccordionItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </Accordion>
        </div>

        {/* Footer Contact Banner */}
        <div className="w-full flex-shrink-0 px-4 md:px-0 mb-4 md:mb-6">
          <AnimatePresence>
              <motion.div 
                className="bg-white border border-slate-200 shadow-sm rounded-[24px] p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group transition-all duration-300 hover:shadow-md hover:border-blue-300 w-full overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
                    <motion.div 
                        whileHover={{ scale: 1.05, rotate: -5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="w-14 h-14 rounded-[20px] bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 shadow-sm relative transition-transform duration-300"
                    >
                        <HelpCircle className="w-6 h-6 text-blue-600" strokeWidth={2.5} />
                    </motion.div>
                    <div className="min-w-0 flex-1 text-left">
                        <h2 className="text-lg sm:text-[21px] font-bold text-slate-900 tracking-tight leading-none mb-1.5 transition-colors">
                            Still have questions?
                        </h2>
                        <p className="text-xs sm:text-[15px] font-medium text-slate-500 leading-[1.4] max-w-xl">
                            Can't find the answer you're looking for? Please chat to our friendly team.
                        </p>
                    </div>
                </div>
                
                <div className="w-full md:w-auto flex-shrink-0">
                    <LinkPreview 
                      url="https://helpdesk.sti.edu/User/Login?ReturnUrl=%2f" 
                      className="inline-flex w-full md:w-auto items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium text-[15px] px-6 py-3.5 rounded-[14px] shadow-sm transition-all duration-300 active:scale-[0.98]"
                    >
                      Get in touch
                    </LinkPreview>
                </div>
              </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

export default FAQPanel;
