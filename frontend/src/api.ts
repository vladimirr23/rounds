const API_BASE_URL = 'http://localhost:3001/api';

export interface App {
  id: number;
  appId: string;
  appName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Screenshot {
  id: number;
  appId: number;
  imageFilename: string;
  status: string;
  createdAt: string;
}

export interface CreateAppData {
  appId: string;
  appName: string;
  description?: string;
}

export interface CaptureResult {
  success: boolean;
  results?: any[];
  error?: string;
}

// Apps API
export const appsAPI = {
  getAll: async (): Promise<App[]> => {
    const response = await fetch(`${API_BASE_URL}/apps`);
    if (!response.ok) throw new Error('Failed to fetch apps');
    return response.json();
  },

  getById: async (id: number): Promise<App> => {
    const response = await fetch(`${API_BASE_URL}/apps/${id}`);
    if (!response.ok) throw new Error('Failed to fetch app');
    return response.json();
  },

  create: async (data: CreateAppData): Promise<App> => {
    const response = await fetch(`${API_BASE_URL}/apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create app');
    }
    return response.json();
  },

  update: async (id: number, data: Partial<CreateAppData>): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/apps/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update app');
    return response.json();
  },

  delete: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/apps/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete app');
    return response.json();
  }
};

// Screenshots API
export const screenshotsAPI = {
  getByAppId: async (appId: number): Promise<Screenshot[]> => {
    const response = await fetch(`${API_BASE_URL}/screenshots/app/${appId}`);
    if (!response.ok) throw new Error('Failed to fetch screenshots');
    return response.json();
  },

  getImage: (filename: string): string => {
    return `${API_BASE_URL}/screenshots/image/${filename}`;
  },

  delete: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/screenshots/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete screenshot');
    return response.json();
  }
};

// Capture API
export const captureAPI = {
  triggerCapture: async (): Promise<CaptureResult> => {
    const response = await fetch(`${API_BASE_URL}/trigger-capture`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to trigger capture');
    return response.json();
  }
};
