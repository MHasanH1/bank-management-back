import type { Request, Response } from "express";
import { pool } from "../db";
import Controller from "./baseController";

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management endpoints
 */

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Add a new customer to the system
 *     tags: [Customers]
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
 *               - phone_number
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: Ali
 *               last_name:
 *                 type: string
 *                 example: Rezaei
 *               national_id:
 *                 type: string
 *                 example: "1234567890"
 *               phone_number:
 *                 type: string
 *                 example: "09123456789"
 *               address:
 *                 type: string
 *                 example: Tehran, Vali Asr Avenue
 *     responses:
 *       201:
 *         description: Customer added successfully
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Customer with this National ID or Phone Number already exists
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/customers/search:
 *   get:
 *     summary: Search for a customer by national ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: national_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Customer's unique 10-digit national ID
 *     responses:
 *       200:
 *         description: Customer information found
 *       400:
 *         description: National ID parameter is required
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/customers/{id}:
 *   patch:
 *     summary: Update customer information
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internal Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone_number
 *             properties:
 *               phone_number:
 *                 type: string
 *                 example: "09999999999"
 *               address:
 *                 type: string
 *                 example: New Address
 *     responses:
 *       200:
 *         description: Customer information updated successfully
 *       400:
 *         description: Phone number is required or ID is invalid
 *       404:
 *         description: Customer not found
 *       409:
 *         description: Phone number is already in use by another customer
 *       500:
 *         description: Internal server error
 *
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internal Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       400:
 *        description: Missing id
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */

class BranchController extends Controller {
  async addBranch(req: Request, res: Response): Promise<void> {
    const { branch_code, branch_name, city, address } = req.body;

    if (!branch_code || !branch_name || !city) {
      return this.errorResponse(
        res,
        400,
        "Branch code, branch name and city are required.",
      );
    }

    try {
      const query = `
          INSERT INTO Branch (branch_code, branch_name, city, address)
          VALUES ($1, $2, $3, $4)
          RETURNING *;
      `;
      const values = [branch_code, branch_name, city, address];
      const result = await pool.query(query, values);

      this.successResponse(
        res,
        201,
        "Customer added successfully.",
        result.rows[0],
      );
    } catch (error: any) {
      if (error.code === "23505") {
        return this.errorResponse(
          res,
          409,
          "A branch with this branch code already exists.",
        );
      }

      console.error("Error adding customer:", error);
      this.errorResponse(res, 500, "Error occurred while adding customer.");
    }
  }

  async searchBranch(req: Request, res: Response): Promise<void> {
    const { branch_name } = req.query;

    try {
      const query = `SELECT * FROM Branch ${branch_name ? "WHERE branch_name = $1" : ""};`;
      const result = await pool.query(query, branch_name ? [branch_name] : []);

      if (result.rows.length === 0)
        return this.errorResponse(res, 404, "Branch not found.");

      this.successResponse(
        res,
        200,
        "Branch information found.",
        result.rows[0],
      );
    } catch (error: any) {
      console.error("Error searching branch:", error);
      this.errorResponse(
        res,
        500,
        "Error occurred while searching for branch.",
      );
    }
  }

  async updateBranch(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { address } = req.body;

    try {
      const query = `
          UPDATE Branch 
          SET address = $1 
          WHERE branch_id = $2 
          RETURNING *;
      `;
      const result = await pool.query(query, [address, id]);

      if (result.rows.length === 0)
        return this.errorResponse(res, 404, "Branch not found.");

      this.successResponse(
        res,
        200,
        "Branch information updated.",
        result.rows[0],
      );
    } catch (error: any) {
      console.error("Error updating customer:", error);
      this.errorResponse(
        res,
        500,
        "Error occurred while updating customer information.",
      );
    }
  }

  async deleteBranch(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!id) return this.errorResponse(res, 400, "Missing id");

    try {
      const query = `DELETE FROM Branch WHERE branch_id = $1;`;
      const result = await pool.query(query, [id]);

      if (result.rowCount === 0)
        return this.errorResponse(res, 404, "Branch not found.");

      this.successResponse(res, 200, "Branch deleted successfully.");
    } catch (error: any) {
      console.error("Error deleting branch:", error);
      this.errorResponse(res, 500, "Error occurred while deleting branch.");
    }
  }
}

export default new BranchController();
