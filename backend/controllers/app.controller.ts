import { Request, Response } from 'express';
import db from '../db.ts';
import { AppData, AppRow } from '../types.ts';

export const createApp = (req: Request, res: Response): void => {
  const { appId, appName, description } = req.body as AppData;


  if (!appId || !appName) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const query = `
    INSERT INTO apps (appId, appName, description)
    VALUES (?, ?, ?)
  `;

  db.run(query, [appId, appName, description || null], function (this: any, err: Error | null) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(409).json({ error: 'App already exists' });
        return;
      }
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.status(201).json({ id: this.lastID, appId, appName, description });
  });
};

export const getAllApps = (req: Request, res: Response): void => {
  const query = `SELECT id, appId, appName, description, createdAt, updatedAt FROM apps ORDER BY createdAt DESC`;

  db.all(query, (err: Error | null, rows: AppRow[] | undefined) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.json(rows || []);
  });
};

export const getAppById = (req: Request, res: Response): void => {
  const { id } = req.params;
  const query = `SELECT id, appId, appName, description, createdAt, updatedAt FROM apps WHERE id = ?`;

  db.get(query, [id], (err: Error | null, row: AppRow | undefined) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'App not found' });
      return;
    }
    res.json(row);
  });
};

export const updateApp = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { appId, appName, description } = req.body as Partial<AppData>;

  const query = `
    UPDATE apps 
    SET appId = COALESCE(?, appId),
        appName = COALESCE(?, appName),
        description = COALESCE(?, description),
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [appId || null, appName || null, description || null, id], function (this: any, err: Error | null) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        res.status(409).json({ error: 'App ID already exists' });
        return;
      }
      res.status(500).json({ error: 'Database error' });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'App not found' });
      return;
    }
    res.json({ message: `App with ID ${id} updated successfully` });
  });
};

export const deleteApp = (req: Request, res: Response): void => {
  const { id } = req.params;
  const query = `DELETE FROM apps WHERE id = ?`;

  db.run(query, [id], function (this: any, err: Error | null) {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'App not found' });
      return;
    }
    res.json({ message: `App with ID ${id} deleted successfully` });
  });
};
