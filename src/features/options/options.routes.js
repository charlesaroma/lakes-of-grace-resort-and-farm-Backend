import { Router } from 'express';
import { getRoomOptions } from './options.controller.js';

const router = Router();

router.get('/room', getRoomOptions);

export default router;
