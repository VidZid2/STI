import { motion } from 'motion/react';
import type { AdminStats, SystemConfigItem, AdminReport, AuditLogEntry } from '../../../services/adminService';
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
    stats: AdminStats;
    isLoading: boolean;
    systemConfig: SystemConfigItem[];
    setSystemConfig: React.Dispatch<React.SetStateAction<SystemConfigItem[]>>;
    reports: AdminReport[];
    setReports: React.Dispatch<React.SetStateAction<AdminReport[]>>;
    auditLog: AuditLogEntry[];
    setAuditLog: React.Dispatch<React.SetStateAction<AuditLogEntry[]>>;
}

const TabOverview: React.FC<TabOverviewProps> = ({
    stats, isLoading,
    systemConfig, setSystemConfig,
    reports, setReports,
    auditLog,
}) => (
    <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex flex-col gap-6"
    >
        {isLoading ? <OverviewSkeleton /> : (
            <>
                <TelemetryCards stats={stats} isLoading={false} />

                <NotificationStats />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AiTelemetry stats={stats} isLoading={false} />
                    <GodModeLookup />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SystemControls systemConfig={systemConfig} setSystemConfig={setSystemConfig} isLoading={false} />
                    <ReportsQueue reports={reports} setReports={setReports} isLoading={false} />
                </div>

                <MaintenanceScheduler />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AuditTimeline auditLog={auditLog} isLoading={false} />
                    <StorageHeatmap stats={stats} isLoading={false} />
                </div>

                <DisasterRecovery />
            </>
        )}
    </motion.div>
);

export default TabOverview;
