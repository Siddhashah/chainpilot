import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import * as usageController from '../controllers/usage.controller.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();
router.use(requireAuth);

router.post('/', usageController.log);
router.post('/upload/:materialId', upload.single('file'), usageController.upload);
router.get('/:materialId', usageController.list);

export default router;
