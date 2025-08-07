
'use client';

import { useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { AUTO_BACKUP_SETTINGS_KEY } from '@/lib/constants';
import { AutoBackupSettings } from '@/lib/types';
import { useToast } from './use-toast';
import { handleBackup } from '@/lib/backup';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import React from 'react';

export function useAutoBackup() {
  const [settings, setSettings] = useLocalStorage<AutoBackupSettings>(AUTO_BACKUP_SETTINGS_KEY, {
    intervalHours: 0,
    officeEndTime: '18:30',
  });
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearInterval(timeoutRef.current);
    }

    if (settings.intervalHours > 0) {
      const intervalMillis = settings.intervalHours * 60 * 60 * 1000;
      
      const runBackup = () => {
        const lastBackup = settings.lastBackupTimestamp || 0;
        const now = Date.now();
        if (now - lastBackup > intervalMillis) {
          console.log('Performing automatic backup...');
          const filename = `auto-backup-${format(now, 'yyyy-MM-dd-HH-mm')}.json`;
          const success = handleBackup(filename);
          if (success) {
            setSettings(prev => ({ ...prev, lastBackupTimestamp: now }));
             toast({
              title: 'Auto-backup Successful',
              description: `Data automatically backed up to ${filename}.`,
            });
          } else {
            console.error('Auto-backup failed.');
          }
        }
      };
      
      // Run backup check immediately and then set interval
      runBackup();
      timeoutRef.current = setInterval(runBackup, intervalMillis);
    }

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [settings, setSettings, toast]);
}
