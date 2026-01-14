import {Router} from 'express'
import { authMiddleware } from '../middlewares/auth.middleware';
import { overview } from '../controllers/analytics.controller';

const router =  Router();

router.get('/analytics/overview', authMiddleware, overview);

export default router;