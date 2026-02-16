import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import appRouter from './routes/app.router.ts';
import screenshotRouter from './routes/screenshot.router.ts';
import { startScheduler, triggerImmediateCapture } from './services/scheduler.service.ts';

const app: Express = express();
const port: string | number = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Routes
app.use('/api/apps', appRouter);
app.use('/api/screenshots', screenshotRouter);

// Diagnostic endpoint to check Puppeteer
app.get('/api/diagnostics', async (req: Request, res: Response): Promise<void> => {
  try {
    const diagnostics: any = {
      platform: process.platform,
      nodeVersion: process.version,
      env: {
        PUPPETEER_SKIP_DOWNLOAD: process.env.PUPPETEER_SKIP_DOWNLOAD || 'not set',
        PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || 'not set'
      }
    };

    res.json(diagnostics);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMsg });
  }
});

// Manual trigger endpoint
app.post('/api/trigger-capture', async (req: Request, res: Response): Promise<void> => {
  const result = await triggerImmediateCapture();
  res.json(result);
});

// Health check
app.get('/api/health', (req: Request, res: Response): void => {
  res.json({ status: 'ok' });
});

// Handle invalid requests
app.use((req: Request, res: Response): void => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(port, (): void => {
  console.log(`Server listening on port ${port}`);
  // Start the scheduler (every hour)
  startScheduler('0 * * * *');
});
