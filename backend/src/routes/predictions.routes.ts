import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as predictionsController from '../controllers/predictions.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', predictionsController.list);
router.post('/generate/:materialId', predictionsController.generate);
router.get('/comparison/:materialId', predictionsController.comparison);

export default router;
