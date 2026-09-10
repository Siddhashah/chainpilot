import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as materialsController from '../controllers/materials.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', materialsController.list);
router.post('/', materialsController.create);
router.get('/:id', materialsController.getOne);
router.put('/:id', materialsController.update);
router.delete('/:id', materialsController.remove);
router.patch('/:id/stock', materialsController.updateStock);

export default router;
