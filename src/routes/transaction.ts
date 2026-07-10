import express from "express";
import { transactionController } from "../controllers";

const router = express.Router();

router.post("/deposit", transactionController.deposit);
router.post("/withdraw", transactionController.withdraw);
router.post("/transfer", transactionController.transfer);

export default router;
