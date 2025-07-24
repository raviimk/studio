
'use client';

import { useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { AUTO_BACKUP_SETTINGS_KEY } from '@/lib/constants';
import { AutoBackupSettings } from '@/lib/types';
import { toast } from './use-toast';
import { handleBackup } from '@/lib/backup';
import { format, formatISO, parse } from 'date-fns';
import { Button } from '@/components/ui/button';

export function useAutoBackup() {
  const [settings, setSettings] = useLocalStorage<AutoBackupSettings>(AUTO_BACKUP_SETTINGS_KEY, { intervalHours: 0 });
  const toastIdRef = useRef<string | null>(null);

  useEffect(() => {
    const checkAndTriggerBackup = () => {
      const now = new Date();
      
      // Regular interval backup
      if (settings.intervalHours > 0) {
        const intervalMillis = settings.intervalHours * 60 * 60 * 1000;
        const lastBackup = settings.lastBackupTimestamp || 0;

        if (now.getTime() - lastBackup > intervalMillis) {
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
            duration: 5000,
          });
          toastIdRef.current = id;
          
          const timeoutId = setTimeout(() => {
              if(toastIdRef.current === id) {
                   triggerBackup();
              }
          }, 5000);
          
          return () => clearTimeout(timeoutId);
        }
      }

      // Office End Time backup
      if (settings.officeEndTime) {
        const todayStr = format(now, 'yyyy-MM-dd');
        if (settings.lastMasterBackupDate !== todayStr) {
           const [hours, minutes] = settings.officeEndTime.split(':').map(Number);
           const officeCloseTimeToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

           if (now >= officeCloseTimeToday) {
               const success = handleBackup(`master-backup-${format(now, 'yyyy-MM-dd-HH-mm')}.json`);
               if (success) {
                  setSettings(prev => ({...prev, lastMasterBackupDate: todayStr }));
                  toast({
                    title: 'Office Closed',
                    description: 'Final backup saved. Jai Mataji 🙏.',
                    duration: 10000,
                  });
               }
           }
        }
      }
    };
    
    // Check every minute
    const timerId = setInterval(checkAndTriggerBackup, 60 * 1000);

    // Also check on initial load
    checkAndTriggerBackup();

    return () => clearInterval(timerId);

  }, [settings, setSettings]);
}
