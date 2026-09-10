import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as calendarController from '../controllers/calendar.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', calendarController.list);
router.post('/', calendarController.create);
router.get('/:id', calendarController.getOne);
router.put('/:id', calendarController.update);
router.delete('/:id', calendarController.remove);

export default router;
