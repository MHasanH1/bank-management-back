import express from "express";
import { authorizeRole } from "../middleware/authMiddleware";
import { customerController } from "../controllers";

const router = express.Router();

router.get("/", authorizeRole([1, 2]), customerController.getAllCustomers);
router.get("/search", authorizeRole([1, 2]), customerController.searchCustomer);
router.post("/", authorizeRole([1, 2]), customerController.addCustomer);
router.patch("/:id", authorizeRole([1, 2]), customerController.updateCustomer);
router.delete("/:id", authorizeRole([1, 2]), customerController.deleteCustomer);

export default router;
