import type { Request, Response } from "express";
import { pool } from "../db";
import Controller from "./baseController";

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees with branch and system user details
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all employees retrieved successfully
 *       500:
 *         description: Internal server error
 */

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

/**
 * @swagger
 * /api/employees/{id}/promote:
 *   patch:
 *     summary: Promote an employee to Administrator
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internal Employee ID
 *     responses:
 *       200:
 *         description: Employee promoted successfully
 *       400:
 *         description: Employee does not have a system account
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/employees/{id}/demote:
 *   patch:
 *     summary: Demote an Administrator to normal Employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internal Employee ID
 *     responses:
 *       200:
 *         description: Employee demoted successfully
 *       400:
 *         description: Employee does not have a system account
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/employees/{id}:
 *  delete:
 *     summary: Delete employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internal Employee ID
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *       400:
 *        description: Missing id
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */

class EmployeeController extends Controller {
  async getAllEmployees(req: Request, res: Response): Promise<void> {
    try {
      const query = `SELECT * FROM vw_employee_details;`;
      const result = await pool.query(query);

      this.successResponse(
        res,
        200,
        "Employees retrieved successfully.",
        result.rows,
      );
    } catch (error: any) {
      console.error("Error fetching employees:", error);
      this.errorResponse(res, 500, "Error occurred while fetching employees.");
    }
  }

  async registerEmployee(req: Request, res: Response): Promise<void> {
    const { first_name, last_name, national_id, branch_id, user_id } = req.body;

    if (!first_name || !last_name || !national_id || !branch_id || !user_id)
      return this.errorResponse(res, 400, "All fields are required.");

    try {
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

  async promoteEmployee(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id) return this.errorResponse(res, 400, "Missing id");

    try {
      const empCheck = await pool.query(
        `SELECT e.user_id, u.role_id 
         FROM Employee e 
         LEFT JOIN SystemUser u ON e.user_id = u.user_id 
         WHERE e.employee_id = $1`,
        [id],
      );

      if (empCheck.rows.length === 0) {
        return this.errorResponse(res, 404, "Employee not found.");
      }
      if (!empCheck.rows[0].user_id) {
        return this.errorResponse(
          res,
          400,
          "This employee does not have a linked system account.",
        );
      }

      if (empCheck.rows[0].role_id === 1) {
        return this.errorResponse(
          res,
          409,
          "Employee is already an Administrator.",
        );
      }

      const query = `
        UPDATE SystemUser 
        SET role_id = 1 
        WHERE user_id = $1 
        RETURNING username, role_id;
      `;
      const result = await pool.query(query, [empCheck.rows[0].user_id]);

      this.successResponse(
        res,
        200,
        "Employee promoted to Administrator successfully.",
        result.rows[0],
      );
    } catch (error: any) {
      console.error("Error while promoting an employee", error);
      this.errorResponse(res, 500, "Internal server error");
    }
  }
  async demoteEmployee(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id) return this.errorResponse(res, 400, "Missing id");

    try {
      const empCheck = await pool.query(
        `SELECT e.user_id, u.role_id 
         FROM Employee e 
         LEFT JOIN SystemUser u ON e.user_id = u.user_id 
         WHERE e.employee_id = $1`,
        [id],
      );

      if (empCheck.rows.length === 0) {
        return this.errorResponse(res, 404, "Employee not found.");
      }
      if (!empCheck.rows[0].user_id) {
        return this.errorResponse(
          res,
          400,
          "This employee does not have a linked system account.",
        );
      }

      if (empCheck.rows[0].role_id === 2) {
        return this.errorResponse(
          res,
          409,
          "Employee is already a normal Employee.",
        );
      }

      const query = `
        UPDATE SystemUser 
        SET role_id = 2 
        WHERE user_id = $1 
        RETURNING username, role_id;
      `;
      const result = await pool.query(query, [empCheck.rows[0].user_id]);

      this.successResponse(
        res,
        200,
        "Employee demoted to normal role successfully.",
        result.rows[0],
      );
    } catch (error: any) {
      console.error("Error while demoting an employee", error);
      this.errorResponse(res, 500, "Internal server error");
    }
  }

  async deleteEmployee(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id) return this.errorResponse(res, 400, "Missing id");

    try {
      const query = `DELETE FROM Employee WHERE employee_id = $1;`;
      const result = await pool.query(query, [id]);

      if (result.rowCount === 0)
        return this.errorResponse(res, 404, "Employee not found");

      this.successResponse(res, 200, "Employee deleted successfully");
    } catch (error) {
      console.log("Error while deleting an employee", error);
      this.errorResponse(res, 500, "Internal server error", error);
    }
  }
}

export default new EmployeeController();
