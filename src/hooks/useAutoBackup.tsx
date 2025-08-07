
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

// This component is no longer in use since data is persisted in Firebase.
// It is kept for reference but has no effect.
export function useAutoBackup() {
    return;
}

    