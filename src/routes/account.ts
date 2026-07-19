import express from "express";
import { accountController } from "../controllers";
import { authorizeRole } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authorizeRole([1, 2]), accountController.openAccount);
router.get("/:accountNumber", accountController.getAccountDetails);
router.patch(
  "/:accountNumber/close",
  authorizeRole([1, 2]),
  accountController.closeAccount,
);

export default router;
