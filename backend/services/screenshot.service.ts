import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import db from '../db.ts';
import { CaptureResult, BatchCaptureResult, AppRow } from '../types.ts';

const screenshotsDir = path.join(__dirname, '..', 'screenshots');

// Function to find Chrome/Chromium executable
function findChromiumExecutable(): string | undefined {
  const isMac = process.platform === 'darwin';
  const isLinux = process.platform === 'linux';
  const isWindows = process.platform === 'win32';

  if (isMac) {
    // Check common macOS locations
    const possiblePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/mac_arm-*/chrome-headless-shell'),
      path.join(os.homedir(), '.cache/puppeteer/chrome/mac_arm-*/chrome')
    ];

    for (const p of possiblePaths) {
      // Handle glob patterns
      if (p.includes('*')) {
        const dir = path.dirname(p);
        if (fs.existsSync(dir)) {
          const entries = fs.readdirSync(dir);
          for (const entry of entries) {
            const fullPath = path.join(dir, entry, path.basename(p));
            if (fs.existsSync(fullPath)) {
              return fullPath;
            }
          }
        }
      } else if (fs.existsSync(p)) {
        return p;
      }
    }
  } else if (isLinux) {
    const possiblePaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
      '/snap/bin/chromium'
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) return p;
    }
  } else if (isWindows) {
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) return p;
    }
  }

  return undefined;
}

// Ensure screenshots directory exists
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

export const captureAppScreenshot = async (appId: number, appGoogleId: string): Promise<CaptureResult> => {
  let browser: Browser | null = null;
  const GOOGLE_PLAY_URL_BASE = `https://play.google.com/store/apps/details?id=`;

  const googlePlayUrl = `${GOOGLE_PLAY_URL_BASE}${appGoogleId}`;

  try {
    // Platform-specific launch options
    const launchOptions: any = {
      headless: true,
      defaultViewport: null,
      timeout: 45000
    };

    // Add platform-specific args
    const isWindows = process.platform === 'win32';
    const isLinux = process.platform === 'linux';
    const isMac = process.platform === 'darwin';

    if (isLinux) {
      launchOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
    } else if (isMac) {
      // macOS - minimal args
      launchOptions.args = [];
    }

    // Try to find and use system Chrome first
    const chromePath = findChromiumExecutable();
    if (chromePath) {
      launchOptions.executablePath = chromePath;
    }


    try {
      browser = await puppeteer.launch(launchOptions);
    } catch (launchError) {
      const launchErrorMsg = launchError instanceof Error ? launchError.message : String(launchError);

      // If we specified executablePath, try without it
      if (launchOptions.executablePath) {
        delete launchOptions.executablePath;
        browser = await puppeteer.launch(launchOptions);
      } else {
        throw launchError;
      }
    }

    const page: Page = await browser.newPage();

    // Set a reasonable viewport
    await page.setViewport({
      width: 1280,
      height: 1024
    });

    // Navigate to the Google Play Store page
    await page.goto(googlePlayUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Generate filename with timestamp
    const timestamp = new Date().getTime();
    const filename = `screenshot_${appId}_${timestamp}.png`;
    const filepath = path.join(screenshotsDir, filename);

    // Take screenshot
    await page.screenshot({
      path: filepath,
      fullPage: false
    });

    // Save screenshot metadata to database
    const screenshotId: number = await new Promise<number>((resolve, reject) => {
      const query = `
        INSERT INTO screenshots (appId, imageFilename, status)
        VALUES (?, ?, 'captured')
      `;
      db.run(query, [appId, filename], function (this: any, err: Error | null) {
        if (err) {
          reject(new Error(`Failed to save screenshot to database: ${err.message}`));
        } else {
          const id: number = this.lastID as number;
          resolve(id);
        }
      });
    });

    return { success: true, filename, screenshotId };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error capturing screenshot for app ${appId}:`, errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export const captureAllAppsScreenshots = async (): Promise<BatchCaptureResult[]> => {
  return new Promise((resolve, reject) => {
    const query = `SELECT id, appId FROM apps`;

    db.all(query, async (err: Error | null, rows: AppRow[] | undefined) => {
      try {
        if (err) {
          console.error('Error fetching apps:', err);
          throw new Error(`Failed to fetch apps: ${err.message}`);
        }

        const results: BatchCaptureResult[] = [];
        if (rows && rows.length > 0) {
          for (const app of rows) {
            try {
              const result = await captureAppScreenshot(app.id, app.appId);
              results.push({
                appId: app.id,
                ...result
              });
            } catch (appError) {
              const errorMessage = appError instanceof Error ? appError.message : 'Unknown error';
              console.error(`Error capturing screenshot for app ${app.id}:`, errorMessage);
              results.push({
                appId: app.id,
                success: false,
                error: errorMessage
              });
            }
          }
        }

        resolve(results);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error in batch capture:', errorMessage);
        reject(new Error(errorMessage));
      }
    });
  });
};
