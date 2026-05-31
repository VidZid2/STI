export interface ToolsSkeletonProps {
    /**
     * The number of placeholder cards to display
     * @default 7
     */
    count?: number;
    
    /**
     * Optional className to attach to the outer skeleton wrapper
     */
    className?: string;
}

export interface ToolItemSkeletonProps {
    /**
     * Delay applied to the shimmer animation (in seconds)
     * Helps create a staggered loading effect across multiple cards
     * @default 0
     */
    delay?: number;
}
