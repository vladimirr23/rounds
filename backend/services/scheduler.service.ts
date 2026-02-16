import cron, { ScheduledTask } from 'node-cron';
import { captureAllAppsScreenshots } from './screenshot.service.ts';

let scheduledJob: ScheduledTask | null = null;
const DEFAULT_INTERVAL = '0 * * * *'; // Every hour it will screenshot the apps and save the screenshots in the screenshots folder.

export const startScheduler = (interval: string = DEFAULT_INTERVAL): void => {
  if (scheduledJob) {
    return;
  }

  scheduledJob = cron.schedule(interval, async () => {
    try {
      await captureAllAppsScreenshots();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in scheduled screenshot capture:', errorMessage);
    }
  });

};

export const stopScheduler = (): void => {
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
  }
};

export const getSchedulerStatus = (): { isRunning: boolean; nextExecution: string } => {
  return {
    isRunning: scheduledJob !== null,
    nextExecution: scheduledJob ? 'scheduled' : 'not running'
  };
};

// Manual trigger endpoint
export const triggerImmediateCapture = async (): Promise<{ success: boolean; results?: any; error?: string }> => {
  try {
    const results = await captureAllAppsScreenshots();
    return { success: true, results };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in immediate capture:', errorMessage);
    return { success: false, error: errorMessage };
  }
};
