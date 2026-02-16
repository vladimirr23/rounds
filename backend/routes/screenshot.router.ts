import express, { Router } from 'express';
import * as screenshotController from '../controllers/screenshot.controller.ts';

const router: Router = express.Router();

router.get('/app/:appId', screenshotController.getScreenshots);
router.post('/', screenshotController.addScreenshot);
router.get('/image/:filename', screenshotController.getScreenshotImage);
router.delete('/:id', screenshotController.deleteScreenshot);

export default router;
