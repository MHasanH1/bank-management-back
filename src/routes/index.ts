import express from "express";
import { authenticateToken, authorizeRole } from "../middleware/authMiddleware";
import authRoutes from "./auth";
import accountRoutes from "./account";
import employeeRoutes from "./employee";
import customerRoutes from "./customer";
import transactionRoutes from "./transaction";
import loanRoutes from "./loan";
import { loanController } from "../controllers";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/accounts", authenticateToken, accountRoutes);
router.use("/employees", authenticateToken, employeeRoutes);
router.use("/customers", authenticateToken, customerRoutes);
router.use("/transactions", authenticateToken, transactionRoutes);
router.use("/loans", authenticateToken, loanRoutes);

router.put(
  "/installments/:installmentId/pay",
  authenticateToken,
  authorizeRole([1, 2]),
  loanController.payInstallment,
);

export default router;
