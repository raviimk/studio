
'use client';

import { useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { AUTO_BACKUP_SETTINGS_KEY } from '@/lib/constants';
import { AutoBackupSettings } from '@/lib/types';
import { toast } from './use-toast';
import { handleBackup } from '@/lib/backup';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export function useAutoBackup() {
  const [settings, setSettings] = useLocalStorage<AutoBackupSettings>(AUTO_BACKUP_SETTINGS_KEY, { intervalHours: 0 });
  const toastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (settings.intervalHours <= 0) {
      return;
    }

    const intervalMillis = settings.intervalHours * 60 * 60 * 1000;

    const checkAndTriggerBackup = () => {
      const now = Date.now();
      const lastBackup = settings.lastBackupTimestamp || 0;

      if (now - lastBackup > intervalMillis) {
        
        const triggerBackup = () => {
          const success = handleBackup(`auto-backup-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`);
          if (success) {
              setSettings(prev => ({ ...prev, lastBackupTimestamp: Date.now() }));
          }
          if(toastIdRef.current) {
             toast.dismiss(toastIdRef.current);
             toastIdRef.current = null;
          }
        };

        const toastContent = (
          <div>
            <p className="mb-2">⏰ It’s time to back up your data!</p>
            <Button onClick={triggerBackup} size="sm">Backup Now</Button>
          </div>
        );

        const { id } = toast({
          title: 'Auto Backup',
          description: toastContent,
          duration: 3000,
        });
        toastIdRef.current = id;
        
        // If not clicked within 3 seconds, auto-trigger
        const timeoutId = setTimeout(() => {
            // Check if the toast is still visible (i.e., not manually dismissed/actioned)
            if(toastIdRef.current === id) {
                 triggerBackup();
            }
        }, 3000);
        
        return () => clearTimeout(timeoutId);
      }
    };
    
    // Check immediately on load and then set an interval
    checkAndTriggerBackup();
    const timerId = setInterval(checkAndTriggerBackup, 60 * 1000); // Check every minute

    return () => clearInterval(timerId);

  }, [settings, setSettings]);
}
