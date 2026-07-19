import express from "express";
import { transactionController } from "../controllers";
import { authorizeRole } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/deposit", authorizeRole([1, 2]), transactionController.deposit);
router.post("/withdraw", authorizeRole([1, 2]), transactionController.withdraw);
router.post("/transfer", authorizeRole([1, 2]), transactionController.transfer);

export default router;
