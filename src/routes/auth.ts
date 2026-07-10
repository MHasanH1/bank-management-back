import express from "express";
import { authController } from "../controllers";
import { authenticateToken, authorizeRole } from "../middleware/authMiddleware";

const router = express.Router();

router.post(
  "/register",
  authenticateToken,
  authorizeRole(1),
  authController.registerUser,
);
router.post("/login", authController.loginUser);

export default router;
