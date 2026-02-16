import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import './App.css';
import { appsAPI, screenshotsAPI, captureAPI, App as AppType, Screenshot, CreateAppData } from './api';


const App: React.FC = () => {
  const [apps, setApps] = useState<AppType[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | string>('');
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<CreateAppData>({
    appId: '',
    appName: '',
    description: ''
  });

  // Load apps on mount
  useEffect(() => {
    loadApps();
  }, []);

  // Load screenshots when selected app changes
  useEffect(() => {
    if (selectedAppId) {
      loadScreenshots(selectedAppId as number);
    } else {
      setScreenshots([]);
    }
  }, [selectedAppId]);

  const loadApps = async (): Promise<void> => {
    try {
      setError('');
      const data = await appsAPI.getAll();
      setApps(data);
      if (data.length > 0 && !selectedAppId) {
        setSelectedAppId(data[0].id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to load apps: ' + errorMessage);
    }
  };

  const loadScreenshots = async (appId: number): Promise<void> => {
    try {
      setError('');
      const data = await screenshotsAPI.getByAppId(appId);
      setScreenshots(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to load screenshots: ' + errorMessage);
    }
  };

  const handleAddApp = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!formData.appId || !formData.appName) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await appsAPI.create(formData);
      setFormData({ appId: '', appName: '', description: '' });
      await loadApps();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to add app: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApp = async (appId: number): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this app?')) {
      try {
        setError('');
        await appsAPI.delete(appId);
        await loadApps();
        setSelectedAppId('');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError('Failed to delete app: ' + errorMessage);
      }
    }
  };

  const handleDeleteScreenshot = async (screenshotId: number): Promise<void> => {
    try {
      setError('');
      await screenshotsAPI.delete(screenshotId);
      await loadScreenshots(selectedAppId as number);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to delete screenshot: ' + errorMessage);
    }
  };

  const handleTriggerCapture = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      await captureAPI.triggerCapture();
      // Reload screenshots after a delay to allow processing
      setTimeout(() => {
        if (selectedAppId) {
          loadScreenshots(selectedAppId as number);
        }
        setLoading(false);
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to trigger capture: ' + errorMessage);
      setLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.currentTarget;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="app">
      <main className="container">
        {error && <div className="error-banner">{error}</div>}

        <div className="control-panel">
          <div className="button-group">

            <button
              className="btn btn-secondary"
              onClick={handleTriggerCapture}
              disabled={loading}
            >
              {loading ? 'Capturing...' : 'Capture Screenshots Now'}
            </button>
          </div>
        </div>

        <div className="add-form-container">
          <form onSubmit={handleAddApp} className="add-form">
            <div className="form-group">
              <label htmlFor="appId">App ID *</label>
              <input
                id="appId"
                name="appId"
                type="text"
                placeholder="e.g., com.activision.callofduty.shooter"
                value={formData.appId}
                onChange={handleInputChange}
                required
              />
            </div>


            <div className="form-group">
              <label htmlFor="appName">App Name *</label>
              <input
                id="appName"
                name="appName"
                type="text"
                placeholder="App name"
                value={formData.appName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Optional description"
                value={formData.description || ''}
                onChange={handleInputChange}
              />
            </div>

            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Adding...' : 'Add App'}
            </button>
          </form>
        </div>

        <div className="main-content">
          <div className="apps-selector">
            <h2>Monitored Apps</h2>
            {apps.length === 0 ? (
              <p className="no-data">No apps added yet. Add one to get started!</p>
            ) : (
              <div className="apps-list">
                {apps.map((app) => (
                  <div key={app.id} className="app-item">
                    <div
                      className={`app-info ${selectedAppId === app.id ? 'active' : ''}`}
                      onClick={() => setSelectedAppId(app.id)}
                    >
                      <h3>{app.appName}</h3>
                      <p className="app-id">{app.appId}</p>
                    </div>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDeleteApp(app.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="screenshots-section">
            <h2>Screenshots Timeline</h2>
            {selectedAppId ? (
              screenshots.length === 0 ? (
                <p className="no-data">No screenshots yet. Capture to see history!</p>
              ) : (
                <div className="screenshots-timeline">
                  {screenshots.map((screenshot) => (
                    <div key={screenshot.id} className="screenshot-item">
                      <div className="screenshot-header">
                        <span className="timestamp">
                          {new Date(screenshot.createdAt).toLocaleString()}
                        </span>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleDeleteScreenshot(screenshot.id)}
                        >
                          Delete
                        </button>
                      </div>
                      <img
                        src={screenshotsAPI.getImage(screenshot.imageFilename)}
                        alt={`Screenshot from ${screenshot.createdAt}`}
                        className="screenshot-image"
                      />
                    </div>
                  ))}
                </div>
              )
            ) : (
              <p className="no-data">Select an app to view screenshots</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
