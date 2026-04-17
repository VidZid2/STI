/**
 * TeacherDashboard Styles
 * Phase 3A: Tailwind CSS class mappings for consistent styling
 * 
 * This file provides Tailwind class strings that can be used alongside
 * or instead of inline styles for better maintainability.
 */

// ============================================
// LAYOUT CLASSES
// ============================================
export const LAYOUT = {
    // Page containers
    pageWrapper: 'min-h-screen bg-slate-50',
    mainContent: 'p-8 max-w-[1400px] mx-auto',
    
    // Grid layouts
    statsGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8',
    twoColumnGrid: 'grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6',
    
    // Flex layouts
    flexCenter: 'flex items-center justify-center',
    flexBetween: 'flex items-center justify-between',
    flexCol: 'flex flex-col',
    flexGap2: 'flex items-center gap-2',
    flexGap3: 'flex items-center gap-3',
    flexGap4: 'flex items-center gap-4',
} as const;

// ============================================
// CARD CLASSES
// ============================================
export const CARD = {
    // Base card styles
    base: 'bg-white rounded-2xl p-6 border border-black/[0.06]',
    panel: 'bg-white rounded-[20px] p-6 border border-black/[0.06]',
    
    // Interactive cards
    interactive: 'bg-white rounded-2xl p-6 border border-black/[0.06] cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
    
    // Stat card
    stat: 'bg-white rounded-2xl p-6 border border-black/[0.06] cursor-pointer transition-all duration-200',
} as const;

// ============================================
// BUTTON CLASSES
// ============================================
export const BUTTON = {
    // Primary button
    primary: 'flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 hover:shadow-md',
    
    // Secondary button
    secondary: 'flex items-center gap-3.5 p-4 rounded-[14px] border border-black/[0.06] bg-white cursor-pointer transition-all duration-200 w-full hover:-translate-y-0.5',
    
    // Icon button
    icon: 'w-10 h-10 rounded-lg border-none bg-black/[0.04] cursor-pointer flex items-center justify-center text-slate-500 transition-all duration-150 hover:bg-red-500/10 hover:scale-105',
    
    // Logout button
    logout: 'w-10 h-10 rounded-lg border-none bg-black/[0.04] cursor-pointer flex items-center justify-center text-slate-500 transition-all duration-150',
} as const;

// ============================================
// ICON CONTAINER CLASSES
// ============================================
export const ICON_CONTAINER = {
    // Small icon container (36px)
    sm: 'w-9 h-9 rounded-lg flex items-center justify-center',
    
    // Medium icon container (44px)
    md: 'w-11 h-11 rounded-xl flex items-center justify-center',
    
    // Large icon container (48px)
    lg: 'w-12 h-12 rounded-[14px] flex items-center justify-center',
    
    // Extra large icon container (64px)
    xl: 'w-16 h-16 rounded-full flex items-center justify-center',
} as const;

// ============================================
// TYPOGRAPHY CLASSES
// ============================================
export const TEXT = {
    // Headings
    h1: 'text-[28px] font-bold text-slate-900 m-0',
    h2: 'text-base font-semibold text-slate-900 m-0',
    h3: 'text-lg font-semibold text-white m-0',
    
    // Body text
    body: 'text-sm text-slate-500',
    bodyLg: 'text-[15px] text-slate-500',
    
    // Small text
    small: 'text-xs text-slate-400',
    
    // Labels
    label: 'text-sm font-semibold text-slate-900',
    labelMuted: 'text-xs text-slate-400',
    
    // Values
    statValue: 'text-[28px] font-bold text-slate-900 mb-1',
} as const;

// ============================================
// HEADER CLASSES
// ============================================
export const HEADER = {
    wrapper: 'bg-white border-b border-black/[0.06] px-8 py-4 sticky top-0 z-[100]',
    container: 'max-w-[1400px] mx-auto flex items-center justify-between',
    
    // Logo
    logo: 'w-[42px] h-[42px] rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg',
    
    // User menu
    userMenu: 'flex items-center gap-3 px-3 py-2 rounded-xl bg-black/[0.02]',
    userAvatar: 'w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm',
} as const;

// ============================================
// BANNER CLASSES
// ============================================
export const BANNER = {
    comingSoon: 'mt-8 px-8 py-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-between',
    badge: 'px-5 py-4 rounded-lg bg-white/20 text-white text-sm font-medium',
} as const;

// ============================================
// ACTIVITY ITEM CLASSES
// ============================================
export const ACTIVITY = {
    item: 'flex items-center gap-3 px-4 py-3 rounded-xl bg-black/[0.015] border border-transparent cursor-pointer transition-all duration-200',
    timeBadge: 'text-[11px] text-slate-400 px-2 py-1 rounded-md bg-black/[0.04]',
} as const;

// ============================================
// SKELETON CLASSES
// ============================================
export const SKELETON = {
    base: 'animate-pulse bg-black/[0.04]',
    box: 'animate-pulse bg-gradient-to-r from-black/[0.02] via-black/[0.06] to-black/[0.02] bg-[length:200%_100%]',
} as const;

// ============================================
// COLOR UTILITY FUNCTIONS
// ============================================
export const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string; light: string }> = {
        '#3b82f6': { bg: 'bg-blue-500', border: 'border-blue-500/20', text: 'text-blue-500', light: 'bg-blue-500/10' },
        'var(--color-success)': { bg: 'bg-emerald-500', border: 'border-emerald-500/20', text: 'text-emerald-500', light: 'bg-emerald-500/10' },
        'var(--color-warning)': { bg: 'bg-amber-500', border: 'border-amber-500/20', text: 'text-amber-500', light: 'bg-amber-500/10' },
        'var(--color-purple)': { bg: 'bg-violet-500', border: 'border-violet-500/20', text: 'text-violet-500', light: 'bg-violet-500/10' },
        'var(--color-danger)': { bg: 'bg-red-500', border: 'border-red-500/20', text: 'text-red-500', light: 'bg-red-500/10' },
    };
    return colorMap[color] || colorMap['#3b82f6'];
};

// ============================================
// COMBINED CLASS HELPERS
// ============================================
export const cn = (...classes: (string | undefined | null | false)[]): string => {
    return classes.filter(Boolean).join(' ');
};

// ============================================
// RESPONSIVE UTILITY CLASSES
// ============================================
export const RESPONSIVE = {
    // Hide on mobile
    hideOnMobile: 'hidden sm:block',
    // Show only on mobile
    showOnMobile: 'block sm:hidden',
    // Responsive padding
    paddingResponsive: 'p-4 sm:p-6 lg:p-8',
    // Responsive gap
    gapResponsive: 'gap-3 sm:gap-4 lg:gap-5',
    // Responsive grid columns
    gridCols1to2: 'grid-cols-1 sm:grid-cols-2',
    gridCols1to4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    gridCols2to4: 'grid-cols-2 lg:grid-cols-4',
} as const;
