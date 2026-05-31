import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { fetchAdminStats, fetchSystemConfig, fetchAdminReports, fetchAuditLog, type AdminStats, type SystemConfigItem, type AdminReport, type AuditLogEntry } from '../../../services/adminService';
import TelemetryCards from './overview/TelemetryCards';
import AiTelemetry from './overview/AiTelemetry';
import GodModeLookup from './overview/GodModeLookup';
import SystemControls from './overview/SystemControls';
import ReportsQueue from './overview/ReportsQueue';
import AuditTimeline from './overview/AuditTimeline';
import StorageHeatmap from './overview/StorageHeatmap';
import DisasterRecovery from './overview/DisasterRecovery';
import OverviewSkeleton from './overview/OverviewSkeleton';
import NotificationStats from './overview/NotificationStats';
import MaintenanceScheduler from './overview/MaintenanceScheduler';

interface TabOverviewProps {
    globalRefreshTrigger: number;
    activeSessions: number;
}

// Module-level cache to prevent data loss on tab unmount
const STATS_CACHE_TTL = 60_000; // 60 seconds
let globalCache = {
    stats: { 
        totalStudents: 0, 
        totalTeachers: 0, 
        systemHealth: 'Degraded', 
        storageObjectBytes: 0, 
        storageDbBytes: 0, 
        aiTokensProcessed: 0, 
        aiEstimatedCost: 0, 
        aiTokensHistory: [], 
        activeSessionsToday: 0,
        aiHoursSaved: 0,
        activeExamsCount: 0,
        activeExamName: null,
        storageHeavyHitters: []
    } as AdminStats,
    systemConfig: [] as SystemConfigItem[],
    reports: [] as AdminReport[],
    auditLog: [] as AuditLogEntry[],
    lastFetchTime: 0,
};

const TabOverview: React.FC<TabOverviewProps> = ({ globalRefreshTrigger, activeSessions }) => {
    const [stats, setStats] = useState<AdminStats>(globalCache.stats);
    const [systemConfig, setSystemConfig] = useState<SystemConfigItem[]>(globalCache.systemConfig);
    const [reports, setReports] = useState<AdminReport[]>(globalCache.reports);
    const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(globalCache.auditLog);
    const [isLoading, setIsLoading] = useState(globalCache.lastFetchTime === 0);

    const loadData = useCallback(async (force = false) => {
        const now = Date.now();
        const stale = now - globalCache.lastFetchTime > STATS_CACHE_TTL;

        if (force || stale) {
            setIsLoading(true);
            try {
                const [statsData, configData, reportsData, logData] = await Promise.all([
                    fetchAdminStats(),
                    fetchSystemConfig(),
                    fetchAdminReports(),
                    fetchAuditLog()
                ]);
                
                globalCache = {
                    stats: statsData,
                    systemConfig: configData,
                    reports: reportsData,
                    auditLog: logData,
                    lastFetchTime: Date.now()
                };

                setStats(statsData);
                setSystemConfig(configData);
                setReports(reportsData);
                setAuditLog(logData);
            } catch (err) {
                console.error("Failed to load admin overview data", err);
            } finally {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        loadData(globalRefreshTrigger > globalCache.lastFetchTime);
    }, [loadData, globalRefreshTrigger]);

    // Keep stats updated with global presence
    const activeStats = { ...stats, activeSessionsToday: activeSessions };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col gap-6"
        >
            {isLoading ? <OverviewSkeleton /> : (
                <>
                    <TelemetryCards stats={activeStats} isLoading={false} />

                    <NotificationStats />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AiTelemetry stats={activeStats} isLoading={false} />
                        <GodModeLookup />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SystemControls systemConfig={systemConfig} setSystemConfig={setSystemConfig} isLoading={false} />
                        <ReportsQueue reports={reports} setReports={setReports} isLoading={false} />
                    </div>

                    <MaintenanceScheduler />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AuditTimeline auditLog={auditLog} isLoading={false} />
                        <StorageHeatmap stats={activeStats} isLoading={false} />
                    </div>

                    <DisasterRecovery />
                </>
            )}
        </motion.div>
    );
};

export default TabOverview;
