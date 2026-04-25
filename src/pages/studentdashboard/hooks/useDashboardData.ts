/**
 * useDashboardData Hook
 * Handles loading and refreshing dashboard data (deadlines, activities, stats)
 */

import { useState, useEffect } from 'react';
import {
    calculateOverallProgress,
    getTotalEnrolledCoursesCount,
    initializeTracking
} from '../../../services/studyTimeService';
import {
    getUpcomingDeadlines,
    type Deadline
} from '../../../services/deadlinesService';
import {
    getRecentActivities,
    type ActivityItem
} from '../../../services/activityService';

interface UseDashboardDataReturn {
    upcomingDeadlines: Deadline[];
    recentActivities: ActivityItem[];
    overallProgress: number;
    totalCourses: number;
    refreshData: () => Promise<void>;
}

export const useDashboardData = (refreshTrigger: number): UseDashboardDataReturn => {
    const [upcomingDeadlines, setUpcomingDeadlines] = useState<Deadline[]>([]);
    const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
    const [overallProgress, setOverallProgress] = useState(() => calculateOverallProgress());
    const [totalCourses, setTotalCourses] = useState(() => getTotalEnrolledCoursesCount());

    // Initialize study time tracking on mount
    useEffect(() => {
        initializeTracking().then(() => {
        }).catch(() => {
        });

        return () => {
        };
    }, []);

    // Load data on mount and when refreshTrigger changes
    useEffect(() => {
        setUpcomingDeadlines(getUpcomingDeadlines(7));
        setOverallProgress(calculateOverallProgress());
        setTotalCourses(getTotalEnrolledCoursesCount());

        // Load recent activities
        getRecentActivities(5).then(setRecentActivities);
    }, [refreshTrigger]);

    const refreshData = async () => {
        setUpcomingDeadlines(getUpcomingDeadlines(7));
        setOverallProgress(calculateOverallProgress());
        setTotalCourses(getTotalEnrolledCoursesCount());
        const activities = await getRecentActivities(5);
        setRecentActivities(activities);
    };

    return {
        upcomingDeadlines,
        recentActivities,
        overallProgress,
        totalCourses,
        refreshData,
    };
};

export default useDashboardData;
