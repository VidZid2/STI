import { motion } from 'motion/react';
import { Cpu, ShieldCheck } from 'lucide-react';
import type { AdminStats } from '../../../../services/adminService';

interface Props { stats: AdminStats; isLoading: boolean; }

const AiTelemetry: React.FC<Props> = ({ stats, isLoading }) => {
    const sparklineData = stats?.aiTokensHistory?.length > 0 ? stats.aiTokensHistory : Array(15).fill(0);
    const maxVal = Math.max(...sparklineData, 1);
    const isMillions = (stats?.aiTokensProcessed || 0) >= 1000000;

    const formatAiTokens = (tokens: number) => {
        if (!tokens) return '0';
        return tokens >= 1000000 ? (tokens / 1000000).toFixed(2) : tokens.toLocaleString();
    };

    return (
        <div className="p-6 rounded-2xl bg-black text-white shadow-xl relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 p-32 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-400/10 rounded-xl border border-yellow-400/20"><Cpu size={18} className="text-yellow-400" /></div>
                        <div>
                            <h3 className="text-base font-bold text-white leading-none">AI Assistant Telemetry</h3>
                            <p className="text-xs text-slate-400 mt-1">Gemini Pro API Inference Usage</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-emerald-500/30 flex items-center gap-1.5">
                        <ShieldCheck size={12} /> Within Quota
                    </span>
                </div>

                <div className="flex flex-wrap gap-6 mb-4">
                    <div>
                        <div className="text-2xl font-black font-mono text-emerald-400">
                            {isLoading ? '...' : stats?.aiHoursSaved?.toLocaleString() || 0}
                            <span className="text-sm font-medium text-emerald-500/60 ml-1">hrs</span>
                        </div>
                        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Human Grading Saved</div>
                    </div>
                    <div>
                        <div className="text-2xl font-black font-mono">
                            {isLoading ? '...' : `≈ ${formatAiTokens(stats?.aiTokensProcessed)}`}
                            <span className="text-sm font-medium text-slate-500 ml-1">{isMillions ? 'M' : ''}</span>
                        </div>
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                            Tokens <span className="normal-case font-normal">(est.)</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-black font-mono text-rose-300">
                            {isLoading ? '...' : `≈ $${stats?.aiEstimatedCost?.toFixed(2) || '0.00'}`}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                            Est. Cost <span className="normal-case font-normal">(est.)</span>
                        </div>
                    </div>
                </div>

                <div className="h-14 flex items-end justify-between gap-1">
                    {sparklineData.map((val, i) => (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${(val / maxVal) * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="w-full bg-gradient-to-t from-blue-900/40 to-blue-600/80 rounded-t-sm hover:from-yellow-500/80 hover:to-yellow-400 transition-colors cursor-pointer relative group"
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-400 text-black font-bold text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                {val.toLocaleString()} tokens
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AiTelemetry;
