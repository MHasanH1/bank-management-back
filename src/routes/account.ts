import express from "express";
import { accountController } from "../controllers";
import { authorizeRole } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", authorizeRole(2), accountController.openAccount);
router.get("/:accountNumber", accountController.getAccountDetails);
router.put(
  "/:accountNumber/close",
  authorizeRole(2),
  accountController.closeAccount,
);

export default router;
