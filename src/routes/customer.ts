import express from "express";
import { authorizeRole } from "../middleware/authMiddleware";
import { customerController } from "../controllers";

const router = express.Router();

router.post("/", authorizeRole(2), customerController.addCustomer);
router.get("/search", customerController.searchCustomer);
router.put("/:id", authorizeRole(2), customerController.updateCustomer);

export default router;
