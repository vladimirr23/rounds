import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import db from '../db.ts';
import { ScreenshotData, ScreenshotRow } from '../types.ts';

const screenshotsDir = path.join(__dirname, '..', 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

export const getScreenshots = (req: Request, res: Response): void => {
  const { appId } = req.params;

  // First check if app exists
  const appCheckQuery = `SELECT id FROM apps WHERE id = ?`;
  db.get(appCheckQuery, [appId], (err: Error | null, appRow: any) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    if (!appRow) {
      res.status(404).json({ error: 'App not found' });
      return;
    }

    const query = `
      SELECT id, appId, imageFilename, status, createdAt 
      FROM screenshots 
      WHERE appId = ? 
      ORDER BY createdAt DESC
    `;

    db.all(query, [appId], (err: Error | null, rows: ScreenshotRow[] | undefined) => {
      if (err) {
        res.status(500).json({ error: 'Database error' });
        return;
      }
      res.json(rows || []);
    });
  });
};

export const addScreenshot = (req: Request, res: Response): void => {
  const { appId, imageFilename } = req.body as ScreenshotData;

  if (!appId || !imageFilename) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // Check if app exists
  const appCheckQuery = `SELECT id FROM apps WHERE id = ?`;
  db.get(appCheckQuery, [appId], (err: Error | null, appRow: any) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    if (!appRow) {
      res.status(404).json({ error: 'App not found' });
      return;
    }

    const query = `
      INSERT INTO screenshots (appId, imageFilename, status)
      VALUES (?, ?, 'captured')
    `;

    db.run(query, [appId, imageFilename], function (this: any, err: Error | null) {
      if (err) {
        res.status(500).json({ error: 'Database error' });
        return;
      }
      res.status(201).json({
        id: this.lastID,
        appId,
        imageFilename,
        status: 'captured',
        createdAt: new Date().toISOString()
      });
    });
  });
};

export const getScreenshotImage = (req: Request, res: Response): void => {
  const { filename } = req.params;

  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/')) {
    res.status(400).json({ error: 'Invalid filename' });
    return;
  }

  const imagePath = path.join(screenshotsDir, filename);

  fs.readFile(imagePath, (err: NodeJS.ErrnoException | null, data: Buffer) => {
    if (err) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }
    res.setHeader('Content-Type', 'image/png');
    res.send(data);
  });
};

export const deleteScreenshot = (req: Request, res: Response): void => {
  const { id } = req.params;

  const query = `SELECT imageFilename FROM screenshots WHERE id = ?`;
  db.get(query, [id], (err: Error | null, row: any) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Screenshot not found' });
      return;
    }

    const deleteQuery = `DELETE FROM screenshots WHERE id = ?`;
    db.run(deleteQuery, [id], function (this: any, err: Error | null) {
      if (err) {
        res.status(500).json({ error: 'Database error' });
        return;
      }

      // Delete the image file
      const imagePath = path.join(screenshotsDir, row.imageFilename);
      fs.unlink(imagePath, (err: NodeJS.ErrnoException | null) => {
        if (err) console.error('Failed to delete image file:', err);
      });

      res.json({ message: `Screenshot with ID ${id} deleted successfully` });
    });
  });
};
