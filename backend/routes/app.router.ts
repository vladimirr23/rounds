import express, { Router } from 'express';
import * as appController from '../controllers/app.controller.ts';

const router: Router = express.Router();

router.post('/', appController.createApp);
router.get('/', appController.getAllApps);
router.get('/:id', appController.getAppById);
router.put('/:id', appController.updateApp);
router.delete('/:id', appController.deleteApp);

export default router;
