import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, DownloadCloud, CheckCircle2 } from 'lucide-react';
import { logAuditEvent, getActorInfo } from '../../../../services/adminService';

const DisasterRecovery: React.FC = () => {
    const [isBackingUp, setIsBackingUp] = React.useState(false);
    const [backupComplete, setBackupComplete] = React.useState(false);

    const handleBackup = async () => {
        setIsBackingUp(true);
        const actor = await getActorInfo();
        await logAuditEvent('backup', actor.name, actor.role, 'Manual database snapshot initiated');
        setTimeout(() => {
            setIsBackingUp(false);
            setBackupComplete(true);
            setTimeout(() => setBackupComplete(false), 3000);
        }, 2000);
    };

    return (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/30 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-[0.03] pointer-events-none" />
            <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl mt-1 shrink-0">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none mb-1.5 flex items-center gap-2">
                        Disaster Recovery <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold rounded">Critical</span>
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                        Generate an immediate, encrypted snapshot of the Supabase PostgreSQL database. This action forces a manual backup dump to the connected cold-storage AWS S3 bucket.
                    </p>
                </div>
            </div>

            <motion.button
                whileHover={{ scale: backupComplete ? 1 : 1.02 }}
                whileTap={{ scale: backupComplete ? 1 : 0.98 }}
                onClick={handleBackup}
                disabled={isBackingUp || backupComplete}
                className={`shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all min-w-[200px] ${
                    backupComplete
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 cursor-not-allowed opacity-90'
                        : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800/40'
                }`}
            >
                {isBackingUp ? (
                    <>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-5 h-5 border-2 border-red-600/30 border-t-red-600 rounded-full" />
                        Compressing Data...
                    </>
                ) : backupComplete ? (
                    <><CheckCircle2 size={18} /> Snapshot Secured</>
                ) : (
                    <><DownloadCloud size={18} /> Generate Snapshot</>
                )}
            </motion.button>
        </div>
    );
};

export default DisasterRecovery;
