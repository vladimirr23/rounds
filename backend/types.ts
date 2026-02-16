// App types
export interface AppData {
  appId: string;
  appName: string;
  description?: string;
}

export interface AppRow extends AppData {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// Screenshot types
export interface ScreenshotData {
  appId: number;
  imageFilename: string;
}

export interface ScreenshotRow {
  id: number;
  appId: number;
  imageFilename: string;
  status: string;
  createdAt: string;
}

export interface CaptureResult {
  success: boolean;
  filename?: string;
  screenshotId?: number;
  error?: string;
}

export interface BatchCaptureResult {
  appId: number;
  success: boolean;
  filename?: string;
  error?: string;
}
