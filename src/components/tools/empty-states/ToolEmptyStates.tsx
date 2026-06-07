/**
 * ToolEmptyStates - Per-tool customized empty states
 * Provides contextual, tool-specific empty states instead of generic placeholders
 */

import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, CheckCircle, Sparkles, FileText, Quote, Shield, AlignLeft, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  onAction?: () => void;
  actionLabel?: string;
}

// Shared animation variants
const containerVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// Grammar Checker - Educational empty state
export const GrammarCheckerEmpty: React.FC<EmptyStateProps> = ({ onAction }) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className="flex flex-col items-center justify-center h-full p-8 text-center"
  >
    <motion.div variants={itemVariants} className="relative mb-6">
      <div className="w-24 h-24 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/50">
        <CheckCircle className="w-12 h-12 text-emerald-500 dark:text-emerald-400" />
      </div>
      <motion.div
        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      </motion.div>
    </motion.div>
    
    <motion.h3 variants={itemVariants} className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
      Ready to Polish Your Writing
    </motion.h3>
    
    <motion.p variants={itemVariants} className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mb-6 leading-relaxed">
      Paste your essay, report, or any text. We'll catch grammar issues, suggest improvements, and explain why changes matter.
    </motion.p>
    
    <motion.div variants={itemVariants} className="flex flex-col gap-2 w-full max-w-xs">
      <button
        onClick={onAction}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors"
      >
        <FileText className="w-4 h-4" />
        Paste Sample Essay
      </button>
      <span className="text-xs text-zinc-400 dark:text-zinc-500">
        Try with: "The students doesn't understand their lessons."
      </span>
    </motion.div>
    
    <motion.div variants={itemVariants} className="mt-8 flex items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500">
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        Grammar
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-blue-400" />
        Style
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        Spelling
      </span>
    </motion.div>
  </motion.div>
);

// Paraphraser - Diff-view oriented empty state
export const ParaphraserEmpty: React.FC<EmptyStateProps> = ({ onAction }) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className="flex flex-col items-center justify-center h-full p-8 text-center"
  >
    <motion.div variants={itemVariants} className="relative mb-6">
      <div className="w-24 h-24 rounded-3xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center border border-violet-100 dark:border-violet-800/50">
        <RotateCcw className="w-12 h-12 text-violet-500 dark:text-violet-400" />
      </div>
      <motion.div
        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-200 dark:bg-violet-700 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <span className="text-xs">↻</span>
      </motion.div>
    </motion.div>
    
    <motion.h3 variants={itemVariants} className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
      Rewrite with Confidence
    </motion.h3>
    
    <motion.p variants={itemVariants} className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mb-6 leading-relaxed">
      Enter text to see side-by-side changes. Compare vocabulary shifts, sentence restructuring, and tone preservation in real-time.
    </motion.p>
    
    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2 w-full max-w-xs">
      {['Standard', 'Formal', 'Fluency', 'Creative'].map((mode, i) => (
        <button
          key={mode}
          onClick={() => onAction?.()}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            i === 0 
              ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          {mode}
        </button>
      ))}
    </motion.div>
    
    <motion.p variants={itemVariants} className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
      Remember: Always cite your original sources when paraphrasing
    </motion.p>
  </motion.div>
);

// Text Summarizer - Study notes oriented empty state
export const TextSummarizerEmpty: React.FC<EmptyStateProps> = ({ onAction }) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className="flex flex-col items-center justify-center h-full p-8 text-center"
  >
    <motion.div variants={itemVariants} className="relative mb-6">
      <div className="w-24 h-24 rounded-3xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/50">
        <AlignLeft className="w-12 h-12 text-blue-500 dark:text-blue-400" />
      </div>
      <motion.div
        className="absolute top-0 right-0 w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-700 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-200"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        TL;DR
      </motion.div>
    </motion.div>
    
    <motion.h3 variants={itemVariants} className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
      Summarize for Any Purpose
    </motion.h3>
    
    <motion.p variants={itemVariants} className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mb-6 leading-relaxed">
      Turn lecture notes, articles, or chapters into concise study materials. Choose from bullet points, key concepts, or review format.
    </motion.p>
    
    <motion.div variants={itemVariants} className="flex flex-col gap-2 w-full max-w-xs">
      <button
        onClick={onAction}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-colors"
      >
        <BookOpen className="w-4 h-4" />
        Summarize Lecture Notes
      </button>
      <div className="flex gap-2">
        <span className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 text-center">
          Key Points
        </span>
        <span className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 text-center">
          Study Notes
        </span>
        <span className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 text-center">
          Review
        </span>
      </div>
    </motion.div>
  </motion.div>
);

// Citation Generator - Academic integrity focused empty state
export const CitationGeneratorEmpty: React.FC<EmptyStateProps> = ({ onAction }) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className="flex flex-col items-center justify-center h-full p-8 text-center"
  >
    <motion.div variants={itemVariants} className="relative mb-6">
      <div className="w-24 h-24 rounded-3xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center border border-amber-100 dark:border-amber-800/50">
        <Quote className="w-12 h-12 text-amber-500 dark:text-amber-400" />
      </div>
      <motion.div
        className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-700 flex items-center justify-center text-xs font-bold text-amber-800 dark:text-amber-200"
        initial={{ rotate: 0 }}
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        "
      </motion.div>
    </motion.div>
    
    <motion.h3 variants={itemVariants} className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
      Cite Sources Perfectly
    </motion.h3>
    
    <motion.p variants={itemVariants} className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mb-6 leading-relaxed">
      Generate properly formatted citations in APA, MLA, or Chicago style. We'll guide you through each required field.
    </motion.p>
    
    <motion.div variants={itemVariants} className="flex flex-col gap-2 w-full max-w-xs">
      <button
        onClick={onAction}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-sm transition-colors"
      >
        <Quote className="w-4 h-4" />
        Create First Citation
      </button>
      <div className="flex gap-2 justify-center">
        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 rounded-full text-xs text-amber-700 dark:text-amber-300 font-medium">
          APA 7th
        </span>
        <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs text-zinc-600 dark:text-zinc-400">
          MLA 9th
        </span>
        <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs text-zinc-600 dark:text-zinc-400">
          Chicago
        </span>
      </div>
    </motion.div>
  </motion.div>
);

// Reference Manager - Library organization empty state
export const ReferenceManagerEmpty: React.FC<EmptyStateProps> = ({ onAction }) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className="flex flex-col items-center justify-center h-full p-8 text-center"
  >
    <motion.div variants={itemVariants} className="relative mb-6">
      <div className="w-24 h-24 rounded-3xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center border border-rose-100 dark:border-rose-800/50">
        <BookOpen className="w-12 h-12 text-rose-500 dark:text-rose-400" />
      </div>
      <motion.div
        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        0
      </motion.div>
    </motion.div>
    
    <motion.h3 variants={itemVariants} className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
      Build Your Reference Library
    </motion.h3>
    
    <motion.p variants={itemVariants} className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mb-6 leading-relaxed">
      Save citations from the Citation Generator or add manually. Export your entire bibliography when you're ready to submit.
    </motion.p>
    
    <motion.div variants={itemVariants} className="flex flex-col gap-2 w-full max-w-xs">
      <button
        onClick={onAction}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-sm transition-colors"
      >
        <BookOpen className="w-4 h-4" />
        Add First Reference
      </button>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Your library syncs across sessions automatically
      </p>
    </motion.div>
  </motion.div>
);

// Word Counter - Stats-focused empty state
export const WordCounterEmpty: React.FC<EmptyStateProps> = ({ onAction }) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className="flex flex-col items-center justify-center h-full p-8 text-center"
  >
    <motion.div variants={itemVariants} className="relative mb-6">
      <div className="w-24 h-24 rounded-3xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center border border-cyan-100 dark:border-cyan-800/50">
        <span className="text-3xl font-black text-cyan-500 dark:text-cyan-400">0</span>
      </div>
      <motion.div
        className="absolute -top-2 right-0 flex gap-1"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <span className="w-2 h-2 rounded-full bg-cyan-400" />
        <span className="w-2 h-2 rounded-full bg-cyan-300" />
        <span className="w-2 h-2 rounded-full bg-cyan-200" />
      </motion.div>
    </motion.div>
    
    <motion.h3 variants={itemVariants} className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
      Analyze Your Text
    </motion.h3>
    
    <motion.p variants={itemVariants} className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mb-6 leading-relaxed">
      Get detailed statistics: word count, reading time, keyword density, and more. Perfect for hitting essay requirements.
    </motion.p>
    
    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2 w-full max-w-xs mb-4">
      <div className="p-3 bg-cyan-50 dark:bg-cyan-900/10 rounded-xl border border-cyan-100 dark:border-cyan-800/30">
        <span className="block text-2xl font-bold text-cyan-600 dark:text-cyan-400">0</span>
        <span className="text-xs text-cyan-600/70 dark:text-cyan-400/70">Words</span>
      </div>
      <div className="p-3 bg-cyan-50 dark:bg-cyan-900/10 rounded-xl border border-cyan-100 dark:border-cyan-800/30">
        <span className="block text-2xl font-bold text-cyan-600 dark:text-cyan-400">0</span>
        <span className="text-xs text-cyan-600/70 dark:text-cyan-400/70">Chars</span>
      </div>
    </motion.div>
    
    <motion.button
      variants={itemVariants}
      onClick={onAction}
      className="flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold text-sm transition-colors w-full max-w-xs"
    >
      <FileText className="w-4 h-4" />
      Paste Essay to Analyze
    </motion.button>
  </motion.div>
);

// Plagiarism Checker - Integrity focused empty state
export const PlagiarismCheckerEmpty: React.FC<EmptyStateProps> = ({ onAction }) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className="flex flex-col items-center justify-center h-full p-8 text-center"
  >
    <motion.div variants={itemVariants} className="relative mb-6">
      <div className="w-24 h-24 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/50">
        <Shield className="w-12 h-12 text-emerald-500 dark:text-emerald-400" />
      </div>
      <motion.div
        className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <span className="text-xs">✓</span>
      </motion.div>
    </motion.div>
    
    <motion.h3 variants={itemVariants} className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
      Check Originality
    </motion.h3>
    
    <motion.p variants={itemVariants} className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mb-6 leading-relaxed">
      Scan your work against academic databases. Get a similarity score and recommendations for proper citation before submission.
    </motion.p>
    
    <motion.div variants={itemVariants} className="flex flex-col gap-2 w-full max-w-xs">
      <button
        onClick={onAction}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors"
      >
        <Shield className="w-4 h-4" />
        Start Plagiarism Scan
      </button>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        This tool is in development. API integration pending.
      </p>
    </motion.div>
  </motion.div>
);

// Export an index for easy importing
export const getEmptyStateForTool = (toolId: string): React.FC<EmptyStateProps> => {
  const emptyStates: Record<string, React.FC<EmptyStateProps>> = {
    'grammar-check': GrammarCheckerEmpty,
    'paraphraser': ParaphraserEmpty,
    'text-summarizer': TextSummarizerEmpty,
    'citation-generator': CitationGeneratorEmpty,
    'reference-manager': ReferenceManagerEmpty,
    'word-counter': WordCounterEmpty,
    'plagiarism-checker': PlagiarismCheckerEmpty,
  };
  
  return emptyStates[toolId] || GrammarCheckerEmpty;
};
