import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SystemConfig {
  maintenance_mode: boolean;
  ai_enabled: boolean;
  submissions_enabled: boolean;
  [key: string]: boolean;
}

export interface MaintenanceWindow {
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

const defaultSystemConfig: SystemConfig = {
  maintenance_mode: false,
  ai_enabled: true,
  submissions_enabled: true,
};

const defaultWindow: MaintenanceWindow = { start_time: null, end_time: null, reason: null };

interface SystemConfigContextType {
  systemConfig: SystemConfig;
  maintenanceWindow: MaintenanceWindow;
  isLoading: boolean;
  refreshConfig: () => void;
}

const SystemConfigContext = createContext<SystemConfigContextType>({
  systemConfig: defaultSystemConfig,
  maintenanceWindow: defaultWindow,
  isLoading: true,
  refreshConfig: () => {},
});

export const SystemConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SystemConfig>(defaultSystemConfig);
  const [maintenanceWindow, setMaintenanceWindow] = useState<MaintenanceWindow>(defaultWindow);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = async () => {
    if (!supabase) { setIsLoading(false); return; }
    try {
      const { data, error } = await supabase.from('system_config').select('key, value, text_value');
      if (!error && data) {
        const newConfig = { ...defaultSystemConfig };
        let win = defaultWindow;
        data.forEach((item: { key: string; value: boolean; text_value?: string }) => {
          if (item.key === 'maintenance_window') {
            try { win = JSON.parse(item.text_value || '{}'); } catch { /* ignore */ }
          } else {
            newConfig[item.key] = item.value;
          }
        });
        setConfig(newConfig);
        setMaintenanceWindow(win);
      }
    } catch (err) {
      console.error('[SystemConfigProvider] Fetch failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => { if (mounted) await fetchConfig(); };
    run();
    const interval = setInterval(run, 15000);
    return () => { mounted = false; clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SystemConfigContext.Provider value={{ systemConfig: config, maintenanceWindow, isLoading, refreshConfig: fetchConfig }}>
      {children}
    </SystemConfigContext.Provider>
  );
};

export const useSystemConfig = () => useContext(SystemConfigContext);
