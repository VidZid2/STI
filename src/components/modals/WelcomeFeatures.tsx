"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  LayoutTemplate,
  Users,
  Target,
  BookOpen,
  BotMessageSquare,
  Check,
  Calendar,
  ChevronRight,
} from "lucide-react";
import FireIcon from "../../../Fire.png";

// Mockup Previews for each new feature

function DayStreakPreview() {
  return (
    <div 
      className="relative w-full max-w-[380px] sm:w-[380px] h-[310px] bg-transparent rounded-[28px] p-6 shadow-md border border-orange-500/30 flex flex-col justify-between transition-all duration-300 group/card mx-auto overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-lg active:-translate-y-1 active:shadow-lg"
    >
      {/* Top: Flame Icon & Text */}
      <div className="flex flex-col items-center mt-1 relative z-10">
        <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[20px] bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-sm relative overflow-hidden mb-3">
          <Flame className="w-8 h-8 fill-white" />
        </div>
        <h4 className="font-extrabold text-[22px] text-white drop-shadow-sm tracking-tight leading-none mb-1.5">12 Days Streak</h4>
        <p className="text-[13px] text-white/90 drop-shadow-sm font-medium text-center px-2 leading-snug">
          You're doing really great, on fire, Student!
        </p>
      </div>

      {/* Middle: Week Grid Box */}
      <div className="w-full bg-orange-950/30 rounded-[18px] p-3.5 border border-white/10 mb-1 mt-2 relative z-10 shadow-inner">
        <div className="flex justify-between items-center text-center px-2">
          {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => {
            const isActive = idx < 4; 
            const isToday = idx === 3; 
            return (
              <div key={idx} className="flex flex-col gap-1.5 items-center">
                <motion.div
                  initial={isActive ? { scale: 0.8, opacity: 0 } : {}}
                  animate={isActive ? { scale: 1, opacity: 1 } : {}}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "flex items-center justify-center transition-all relative",
                    !isToday ? "h-[28px] w-[28px] rounded-full" : "h-[28px] w-[28px]",
                    isActive
                      ? isToday
                        ? ""
                        : "bg-gradient-to-tr from-violet-500 to-purple-500 shadow-sm"
                      : "border border-white/30 bg-white/5"
                  )}
                >
                  {isActive ? (
                    isToday ? (
                      <img 
                        src={FireIcon} 
                        alt="Fire" 
                        className="absolute w-[64px] h-[64px] max-w-none object-contain pointer-events-none translate-y-1" 
                        style={{ filter: "drop-shadow(0 0 1.5px rgba(255,255,255,0.9))" }}
                      />
                    ) : (
                      <Check className="w-4 h-4 text-white stroke-[3.5]" />
                    )
                  ) : null}
                </motion.div>
                <span className="text-[10px] text-white/80 drop-shadow-sm font-bold tracking-wide leading-none">{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom: See Details */}
      <div className="flex justify-center relative z-10">
        <button className="text-[13px] font-bold text-white hover:text-white/80 drop-shadow-sm flex items-center gap-1 transition-colors">
          See Details <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function QuickViewWidgetsPreview() {
  return (
    <div className="w-full max-w-[280px] md:max-w-[360px] flex flex-col gap-3">
      {/* Study Insights Widget */}
      <div className="bg-white dark:bg-[#18181b] rounded-2xl p-4 shadow-md transition-all duration-300 transform-gpu antialiased cursor-pointer hover:-translate-y-1 hover:shadow-lg active:-translate-y-1 active:shadow-lg border border-white/20 dark:border-slate-800/40 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100/30 dark:border-blue-800/30 flex items-center justify-center w-7 h-7">
              <svg className="text-blue-600 dark:text-blue-400 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">Study Insights</span>
            <span className="px-1.5 py-0.5 rounded-full border bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/40 dark:border-emerald-800/30 font-semibold text-[9px]">
                ↑ 12%
            </span>
          </div>
        </div>

        {/* Mini Bar Chart */}
        <div className="flex items-end justify-between gap-1 h-14 mt-1">
          {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1 items-center h-full justify-end">
              <div 
                className={cn(
                  "w-full rounded-t-[4px] transition-colors duration-300",
                  i === 6 
                    ? "bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300" 
                    : "bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-600"
                )}
                style={{ height: `${h}%`, minHeight: '4px' }}
              />
              <span className={cn(
                "text-[8px] text-center",
                i === 6 ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-400 dark:text-slate-500"
              )}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
              </span>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 gap-2">
            <div className="flex-1 text-center">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">14.5h</p>
                <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[8px]">This Week</p>
            </div>
            <div className="w-px h-6 bg-slate-100 dark:bg-slate-700/60" />
            <div className="flex-1 text-center">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">2.1h</p>
                <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[8px]">Daily Avg</p>
            </div>
        </div>
      </div>

      {/* Schedule Widget */}
      <div className="bg-white dark:bg-[#18181b] rounded-2xl p-3 shadow-md transition-all duration-300 transform-gpu antialiased cursor-pointer hover:-translate-y-1 hover:shadow-lg active:-translate-y-1 active:shadow-lg border border-white/20 dark:border-slate-800/40 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-550 flex items-center justify-center shrink-0">
          <Calendar className="size-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">STI Web Dev 2 Lab</h5>
          <p className="text-[9px] text-slate-400 dark:text-slate-500">Rm 402 • 1:00 PM</p>
        </div>
        <span className="text-[8px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">IN 10m</span>
      </div>
    </div>
  );
}

function GroupPagePreview() {
  return (
    <div className="relative w-full max-w-[280px] md:max-w-[360px] bg-white dark:bg-[#18181b] rounded-2xl p-4 shadow-md transition-all duration-300 transform-gpu antialiased cursor-pointer hover:-translate-y-1 hover:shadow-lg active:-translate-y-1 active:shadow-lg border border-white/20 dark:border-slate-800/40 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">COLLABORATION</span>
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      {/* Project Card */}
      <div className="bg-slate-50 dark:bg-[#27272a]/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-800 dark:text-slate-200 font-bold truncate">Research Proposal</span>
          <span className="text-emerald-500 font-black">85%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "85%" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-emerald-500 rounded-full"
          />
        </div>
      </div>

      {/* Chats */}
      <div className="flex flex-col gap-2 mt-1">
        <div className="flex gap-2 items-start">
          <div className="h-5 w-5 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center uppercase shrink-0">J</div>
          <div className="bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 rounded-xl px-2.5 py-1 text-[10px] max-w-[85%] leading-normal">
            Jose: Uploaded chapter 3 draft!
          </div>
        </div>
        <div className="flex gap-2 items-start justify-end">
          <div className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 rounded-xl px-2.5 py-1 text-[10px] max-w-[85%] leading-normal">
            Maria: Looks super clean 👍
          </div>
          <div className="h-5 w-5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center uppercase shrink-0">M</div>
        </div>
      </div>
    </div>
  );
}

function GoalsSystemPreview() {
  return (
    <div className="relative w-full max-w-[280px] md:max-w-[360px] bg-white dark:bg-[#18181b] rounded-[20px] p-4 shadow-md transition-all duration-300 transform-gpu antialiased cursor-pointer hover:-translate-y-1 hover:shadow-lg active:-translate-y-1 active:shadow-lg border border-white/20 dark:border-slate-800/40 flex flex-col overflow-hidden">
        {/* Action Buttons floating top right */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
            <div className="flex items-center justify-center w-7 h-7 rounded-[10px] bg-[#fff8e6] text-amber-500 dark:bg-amber-900/30 dark:text-amber-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            </div>
        </div>

        {/* Header Layout */}
        <div className="flex items-start gap-2.5 mb-2 relative z-10 pr-[40px]">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800/30 text-indigo-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
            </div>
            
            <div className="flex flex-col flex-1 min-w-0">
                <h3 className="text-[13px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate mb-1">
                    Read Normalization Guide
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30">
                        High
                    </span>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800/50 dark:border-slate-700/50 dark:text-slate-400">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <span className="text-[9px] font-bold uppercase tracking-wider">1 day left</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Description */}
        <div className="mb-3 flex flex-col gap-1 relative z-10">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                Info Management
            </div>
            <p className="m-0 text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mt-0.5">
                Read the first 3 chapters of the Normalization guide to prepare for the upcoming Database Assignment.
            </p>
        </div>

        {/* Progress Section */}
        <div className="mt-auto flex flex-col gap-3 relative z-10 w-full pt-3 border-t border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-2.5 w-full">
                <div className="relative shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-slate-700/50 shadow-sm p-1">
                    {/* Simulated circular progress */}
                    <div className="w-8 h-8 rounded-full border-[3px] border-indigo-500 border-t-indigo-100 dark:border-indigo-500 dark:border-t-slate-700 flex items-center justify-center">
                       <span className="text-[9px] font-extrabold text-slate-800 dark:text-slate-200">66%</span>
                    </div>
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
                        In Progress
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                            <svg className="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            2 / 3 chapters completed
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

function CourseSystemPreview() {
  return (
    <div className="relative w-full max-w-[440px] md:max-w-[480px] bg-white dark:bg-slate-900 rounded-[20px] p-4 shadow-md transition-all duration-300 transform-gpu antialiased cursor-pointer hover:-translate-y-1 hover:shadow-lg active:-translate-y-1 active:shadow-lg border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-3 overflow-hidden">
      
      {/* Title & Course Name */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Information Management</span>
        <h3 className="text-[13px] font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
          1. Normalization Rules (1NF)
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          {/* Left Column: Overview and Progress */}
          <div className="flex flex-col gap-3 flex-[1.2]">
              {/* Overview Card */}
              <div className="relative overflow-hidden border rounded-[10px] p-2.5 flex items-start gap-2.5 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 shadow-sm flex-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100/80 dark:border-blue-800/30">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-600 dark:text-blue-400" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div className="flex-1 relative z-10 text-left min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">Module Overview</p>
                  <div className="w-full h-1.5 rounded-full bg-slate-200/60 dark:bg-slate-700 mt-1.5" />
                  <div className="w-2/3 h-1.5 rounded-full bg-slate-200/60 dark:bg-slate-700 mt-1.5" />
                </div>
              </div>

              {/* Progress & Button */}
              <div className="flex flex-col gap-2 mt-auto">
                <div className="w-full">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Progress</span>
                    <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400">50%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/5">
                     <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 w-1/2" />
                  </div>
                </div>
                <div className="w-full py-2 px-3 text-[11px] font-bold rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1.5 hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-colors shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  Continue Learning
                </div>
              </div>
          </div>

          {/* Right Column: Learning Materials Checklist */}
          <div className="flex flex-col gap-1.5 bg-white dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-800/80 rounded-[12px] p-2 shadow-sm flex-1">
             <div className="flex items-center justify-between px-1 mb-0.5">
                <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Materials</span>
                <span className="text-[8px] font-bold text-emerald-500">1 of 2</span>
             </div>
             <div className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30">
                <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-blue-50 text-blue-500 dark:bg-blue-900/20">
                   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <div className="flex-1">
                    <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1">Handout A</p>
                </div>
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center dark:bg-emerald-900/30">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
             </div>
             <div className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800/10">
                <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-rose-50 text-rose-500 dark:bg-rose-900/20">
                   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                </div>
                <div className="flex-1">
                    <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1">Video Lecture</p>
                </div>
                <div className="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center" />
             </div>
          </div>
      </div>

    </div>
  );
}

function SupportAIPreview() {
  return (
    <div className="relative w-full max-w-[320px] md:max-w-[400px] bg-slate-50 dark:bg-[#0f172a] rounded-[24px] p-4 shadow-xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-3 transition-all duration-300 transform-gpu cursor-pointer hover:-translate-y-1 hover:shadow-2xl">
      
      {/* Help Center Header Card */}
      <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[20px] p-3 flex items-center gap-3">
        {/* Background glow */}
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-16 h-16 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="w-11 h-11 rounded-[14px] bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-sm text-blue-600 dark:text-blue-400 relative z-10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0 pr-2">
            <h2 className="font-bold text-[14.5px] text-zinc-900 dark:text-zinc-100 tracking-tight m-0 mb-0.5 truncate">
                Help Center
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed m-0 truncate">
                Find answers and resources
            </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative px-0.5">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
              </svg>
          </div>
          <div className="w-full py-2.5 pl-9 pr-3 rounded-[10px] border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800/30 text-[11px] text-slate-400 flex items-center">
             Search for help...
          </div>
      </div>

      {/* Quick Link Cards */}
      <div className="grid grid-cols-2 gap-2 mt-1 px-0.5">
          {/* Status Link */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[16px] p-3 flex flex-col items-start relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-12 h-12 bg-emerald-500/10 rounded-full blur-lg pointer-events-none" />
              <div className="w-8 h-8 rounded-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mb-2.5 relative z-10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
              </div>
              <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug mb-1 relative z-10">
                  System Status
              </p>
              <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1" />
              <div className="w-10 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1" />
          </div>

          {/* Community Link */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-[16px] p-3 flex flex-col items-start relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-12 h-12 bg-blue-500/10 rounded-full blur-lg pointer-events-none" />
              <div className="w-8 h-8 rounded-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mb-2.5 relative z-10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
              </div>
              <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug mb-1 relative z-10">
                  Community
              </p>
              <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1" />
              <div className="w-10 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1" />
          </div>
      </div>
      
    </div>
  );
}

const featuresData = [
  {
    id: "streak",
    icon: Flame,
    title: "Day Streak",
    subtitle: "Build consistent habits",
    content: "Stay motivated by tracking your consecutive study days. Build habits that last and keep pushing your personal records higher.",
    textColor: "text-orange-500",
    glowColor: "rgba(249, 115, 22, 0.15)",
  },
  {
    id: "widgets",
    icon: LayoutTemplate,
    title: "Quick View Widgets",
    subtitle: "Dashboard upgraded",
    content: "Your dashboard, upgraded. Access everything you need at a glance without ever having to switch tabs or pages.",
    textColor: "text-blue-500",
    glowColor: "rgba(59, 130, 246, 0.15)",
  },
  {
    id: "group",
    icon: Users,
    title: "Group Page",
    subtitle: "Collaborate with peers",
    content: "Seamlessly collaborate with your peers, manage group assignments effortlessly, and communicate in real-time.",
    textColor: "text-emerald-500",
    glowColor: "rgba(16, 185, 129, 0.15)",
  },
  {
    id: "goals",
    icon: Target,
    title: "Revamp Goals System",
    subtitle: "Set and crush targets",
    content: "Set, track, and crush your academic goals with our entirely new goal-setting engine built for student success.",
    textColor: "text-rose-500",
    glowColor: "rgba(244, 63, 94, 0.15)",
  },
  {
    id: "courses",
    icon: BookOpen,
    title: "Revamp Course System",
    subtitle: "Distraction-free learning",
    content: "A streamlined, distraction-free view for your modules, lessons, and quizzes. Focus entirely on your learning material.",
    textColor: "text-amber-500",
    glowColor: "rgba(245, 158, 11, 0.15)",
  },
  {
    id: "ai",
    icon: BotMessageSquare,
    title: "Support & Helper AI",
    subtitle: "Intelligent assistance",
    content: "Stuck on a problem? Ask our built-in intelligent AI assistant for immediate, step-by-step help and guidance.",
    textColor: "text-purple-500",
    glowColor: "rgba(168, 85, 247, 0.15)",
  },
];

export function WelcomeFeatures() {
  const [activeId, setActiveId] = useState("streak");
  const [isPaused, setIsPaused] = useState(false);

  const progressRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const mobileProgressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) {
      lastTimeRef.current = null;
      return;
    }

    let animationFrameId: number;

    const animate = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      progressRef.current += (deltaTime / 4000) * 100;

      if (progressRef.current >= 100) {
        progressRef.current = 0;
        setActiveId((prev) => {
          const currentIndex = featuresData.findIndex((f) => f.id === prev);
          const nextIndex = (currentIndex + 1) % featuresData.length;
          return featuresData[nextIndex].id;
        });
      }

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${progressRef.current}%`;
      }
      if (mobileProgressBarRef.current) {
        mobileProgressBarRef.current.style.width = `${progressRef.current}%`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  const activeFeature = featuresData.find((f) => f.id === activeId) || featuresData[0];

  const getPreviewComponent = (id: string) => {
    switch (id) {
      case "streak":
        return <DayStreakPreview />;
      case "widgets":
        return <QuickViewWidgetsPreview />;
      case "group":
        return <GroupPagePreview />;
      case "goals":
        return <GoalsSystemPreview />;
      case "courses":
        return <CourseSystemPreview />;
      case "ai":
        return <SupportAIPreview />;
      default:
        return null;
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Title */}
      <div className="text-center mb-6 sm:mb-8 shrink-0 px-4">
        <h3 className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">New features!</h3>
      </div>

      <div className="w-full pb-6 px-1 sm:px-2">
        {/* Desktop Layout (md and up) */}
        <div className="hidden md:grid grid-cols-12 gap-6 items-stretch min-h-[460px]">
          {/* Left Feature Buttons List */}
          <div className="col-span-5 flex flex-col gap-2.5 overflow-y-auto max-h-[460px] pr-2 scrollbar-none">
            {featuresData.map((item) => {
              const isActive = activeId === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    progressRef.current = 0;
                    setActiveId(item.id);
                  }}
                  className={cn(
                    "group relative flex w-full items-center gap-3.5 p-3 text-left rounded-xl transition-all duration-300 border outline-none active:translate-y-[2px] active:border-b",
                    isActive
                      ? "bg-blue-50/60 dark:bg-blue-900/10 border-blue-200 border-b-[3px] border-b-blue-300 dark:border-blue-800/40 dark:border-b-blue-800/70 shadow-sm"
                      : "bg-white dark:bg-[#18181b]/50 border-slate-100 border-b-[3px] border-b-slate-200 dark:border-slate-800/40 dark:border-b-slate-700 hover:bg-slate-50 dark:hover:bg-[#27272a]/40 hover:-translate-y-0.5"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-blue-600"
                    )}
                  >
                    <Icon className="size-4.5" />
                  </span>
                  <div className="flex-1 min-w-0 pr-6">
                    <h4
                      className={cn(
                        "text-[13.5px] font-bold flex items-center gap-1.5 leading-none",
                        isActive ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200"
                      )}
                    >
                      {item.title}
                      <span className="text-[8px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-950/40 px-1 py-0.5 rounded scale-90">
                        NEW
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1 leading-none">
                      {item.subtitle}
                    </p>
                  </div>
                  <ChevronRight
                    className={cn(
                      "size-4 shrink-0 transition-all text-slate-400",
                      isActive
                        ? "opacity-100 translate-x-0 text-blue-600"
                        : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                    )}
                  />

                </button>
              );
            })}
          </div>

          {/* Right Showcase Box */}
          <div className="col-span-7 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-dot-black/[0.02] dark:bg-dot-white/[0.02] pointer-events-none" />

            <div className="flex-1 flex flex-col items-center justify-center relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeId}
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-full flex flex-col items-center justify-center"
                  style={{ willChange: "transform, opacity" }}
                >
                  {/* Mock Widget Preview Area */}
                  <div className="flex flex-col items-center justify-center w-full">
                    {getPreviewComponent(activeId)}
                  </div>

                  {/* Copy Description Panel */}
                  <div className="text-center mt-5 max-w-sm">
                    <h3 className="text-[14px] font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5">
                      <activeFeature.icon className={cn("size-4.5", activeFeature.textColor)} />
                      {activeFeature.title}
                    </h3>
                    <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
                      {activeFeature.content}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Layout (md and down) */}
        <div className="md:hidden flex flex-col gap-4">
          {/* Horizontal Tab Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
            {featuresData.map((item) => {
              const isActive = activeId === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    progressRef.current = 0;
                    setActiveId(item.id);
                  }}
                  className={cn(
                    "flex shrink-0 items-center justify-center p-3 rounded-xl transition-all border outline-none relative overflow-hidden",
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                      : "bg-white dark:bg-[#18181b]/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800/40"
                  )}
                >
                  <Icon className="size-5 relative z-10" />

                </button>
              );
            })}
          </div>

          {/* Active Preview Spotlight Card */}
          <div className="w-full bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 relative overflow-hidden min-h-[300px]">
            {/* Ambient Glow */}
            <div
              className="absolute inset-0 transition-colors duration-1000 -z-10 pointer-events-none"
              style={{
                background: `radial-gradient(circle 180px at 50% 50%, ${activeFeature.glowColor}, transparent 80%)`,
              }}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeId}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="w-full flex flex-col items-center gap-4"
                style={{ willChange: "transform, opacity" }}
              >
                <div className="flex items-center justify-center w-full min-h-[160px] py-1">
                  {getPreviewComponent(activeId)}
                </div>
                <div className="text-center">
                  <h4 className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5">
                    <activeFeature.icon className={cn("size-4", activeFeature.textColor)} />
                    {activeFeature.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1.5">
                    {activeFeature.content}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
