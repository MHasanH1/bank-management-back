import type { Request, Response } from "express";
import { pool } from "../db";
import Controller from "./baseController";

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: Employee management and retrieval
 */

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Register new employee (admin only)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: Mohammad
 *               last_name:
 *                 type: string
 *                 example: Hosseini
 *               national_id:
 *                 type: string
 *                 example: "0987654321"
 *               branch_id:
 *                 type: integer
 *                 example: 1
 *               user_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Employee registered successfully
 */

class EmployeeController extends Controller {
  async registerEmployee(req: Request, res: Response): Promise<void> {
    const { first_name, last_name, national_id, branch_id, user_id } = req.body;

    try {
      const query = `
              INSERT INTO Employee (first_name, last_name, national_id, branch_id, user_id)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING *;
          `;
      const values = [first_name, last_name, national_id, branch_id, user_id];

      const result = await pool.query(query, values);
      res.status(201).json({
        message: "Employee registered successfully.",
        employee: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error registering employee:", error);
      res
        .status(500)
        .json({ error: "Error occurred while registering employee." });
    }
  }
}

export default new EmployeeController();
