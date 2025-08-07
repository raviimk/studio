
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

    // Office End Time Backup Logic
    let officeEndTimeout: NodeJS.Timeout | null = null;
    if (settings.officeEndTime) {
      const checkAndBackupAtOfficeEnd = () => {
        const now = new Date();
        const todayStr = format(now, 'yyyy-MM-dd');
        
        const [hours, minutes] = settings.officeEndTime.split(':').map(Number);
        const officeEndTimeToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

        // If it's already past the end time for today, do nothing until tomorrow
        if (now > officeEndTimeToday) {
            // Check if master backup for today has already been done
            if (settings.lastMasterBackupDate === todayStr) {
                return; // Already backed up today
            }
        }

        const runMasterBackup = () => {
             const nowForFilename = new Date();
             const filename = `MASTER-backup-${format(nowForFilename, 'yyyy-MM-dd')}.json`;
             const success = handleBackup(filename);
             if (success) {
                setSettings(prev => ({ ...prev, lastMasterBackupDate: format(nowForFilename, 'yyyy-MM-dd') }));
                 toast({
                  title: 'Office-End Backup Successful',
                  description: `Master backup created: ${filename}.`,
                  duration: 10000,
                });
              } else {
                console.error('Office-end master backup failed.');
              }
        };

        const timeUntilOfficeEnd = officeEndTimeToday.getTime() - now.getTime();

        if (timeUntilOfficeEnd > 0) {
            officeEndTimeout = setTimeout(() => {
                // Check again to ensure we haven't already backed up via other means
                if (settings.lastMasterBackupDate !== todayStr) {
                    runMasterBackup();
                }
            }, timeUntilOfficeEnd);
        }
      };
      
      checkAndBackupAtOfficeEnd(); // Check when effect runs
      const dailyCheckInterval = setInterval(checkAndBackupAtOfficeEnd, 60 * 60 * 1000); // Check every hour
      
      return () => {
        clearInterval(dailyCheckInterval);
        if (officeEndTimeout) clearTimeout(officeEndTimeout);
      };
    }


    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
      if (officeEndTimeout) {
        clearTimeout(officeEndTimeout);
      }
    };
  }, [settings, setSettings, toast]);
}
