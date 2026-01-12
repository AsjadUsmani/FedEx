import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { assignCase, createCase, listCases, updateCaseStatus } from "../controllers/case.controller.js";

const router = Router();

router.post('/', authMiddleware, createCase);
router.get('/', authMiddleware, listCases);
router.put("/:id/assign", authMiddleware, assignCase);
router.put("/:id/status", authMiddleware, updateCaseStatus);

export default router;