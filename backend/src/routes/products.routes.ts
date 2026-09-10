import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as productsController from '../controllers/products.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', productsController.list);
router.post('/', productsController.create);
router.get('/:id', productsController.getOne);
router.put('/:id', productsController.update);
router.delete('/:id', productsController.remove);

export default router;
