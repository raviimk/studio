
import { format } from "date-fns";
import { ALL_APP_KEYS } from "./constants";

export const handleBackup = (filename: string): boolean => {
    try {
      const backupData: { [key: string]: any } = {};
      ALL_APP_KEYS.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          backupData[key] = JSON.parse(data);
        }
      });
      
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Backup failed:', error);
      // We don't toast here so it can be used silently by hooks.
      // The caller should handle user feedback.
      return false;
    }
};
