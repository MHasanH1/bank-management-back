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
 *     summary: Register a new employee (Admin only)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - national_id
 *               - branch_id
 *               - user_id
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
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized (Token missing or invalid)
 *       403:
 *         description: Forbidden (Only Administrators can register employees)
 *       404:
 *         description: Branch or System User not found
 *       409:
 *         description: Employee with this National ID already exists or User ID is already assigned
 *       500:
 *         description: Internal server error
 */

class EmployeeController extends Controller {
  async registerEmployee(req: Request, res: Response): Promise<void> {
    const { first_name, last_name, national_id, branch_id, user_id } = req.body;

    if (!first_name || !last_name || !national_id || !branch_id || !user_id) {
      return this.errorResponse(res, 400, "All fields are required.");
    }

    try {
      // 1. Validate if the National ID already exists
      const employeeExists = await pool.query(
        "SELECT employee_id FROM Employee WHERE national_id = $1",
        [national_id],
      );
      if (employeeExists.rows.length > 0) {
        return this.errorResponse(
          res,
          409,
          "An employee with this National ID already exists.",
        );
      }

      // 2. Validate if the Branch actually exists
      const branchExists = await pool.query(
        "SELECT branch_id FROM Branch WHERE branch_id = $1",
        [branch_id],
      );
      if (branchExists.rows.length === 0) {
        return this.errorResponse(
          res,
          404,
          "The specified branch_id does not exist.",
        );
      }

      // 3. Validate if the System User actually exists
      const userExists = await pool.query(
        "SELECT user_id FROM SystemUser WHERE user_id = $1",
        [user_id],
      );
      if (userExists.rows.length === 0) {
        return this.errorResponse(
          res,
          404,
          "The specified user_id does not exist.",
        );
      }

      // 4. Validate if the user_id is already linked to another employee (Unique constraint check)
      const userLinked = await pool.query(
        "SELECT employee_id FROM Employee WHERE user_id = $1",
        [user_id],
      );
      if (userLinked.rows.length > 0) {
        return this.errorResponse(
          res,
          409,
          "This user_id is already assigned to another employee.",
        );
      }

      // 5. Insert new employee
      const insertQuery = `
        INSERT INTO Employee (first_name, last_name, national_id, branch_id, user_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const values = [first_name, last_name, national_id, branch_id, user_id];
      const result = await pool.query(insertQuery, values);

      this.successResponse(
        res,
        201,
        "Employee registered successfully.",
        result.rows[0],
      );
    } catch (error: any) {
      console.error("Error registering employee:", error);
      this.errorResponse(
        res,
        500,
        "Error occurred while registering employee.",
      );
    }
  }
}

export default new EmployeeController();
