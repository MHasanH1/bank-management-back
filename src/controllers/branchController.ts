import type { Request, Response } from "express";
import { pool } from "../db";
import Controller from "./baseController";

/**
 * @swagger
 * tags:
 *   name: Branches
 *   description: Branch management endpoints
 */

/**
 * @swagger
 * /api/branches:
 *   post:
 *     summary: Add a new branch to the system
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branch_code
 *               - branch_name
 *               - city
 *             properties:
 *               branch_code:
 *                 type: string
 *                 example: "BR-1001"
 *               branch_name:
 *                 type: string
 *                 example: "Central Branch"
 *               city:
 *                 type: string
 *                 example: "Shiraz"
 *               address:
 *                 type: string
 *                 example: Tehran, Vali Asr Avenue
 *     responses:
 *       201:
 *         description: Branch added successfully
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Branch with this National ID or Phone Number already exists
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/branches/search:
 *   get:
 *     summary: Search for a branch by branch name
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branch_name
 *         schema:
 *           type: string
 *         required: false
 *         description: Branch's branch name
 *     responses:
 *       200:
 *         description: Branch information found
 *       404:
 *         description: Branch not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/branches/{id}:
 *   patch:
 *     summary: Update branch information
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internal Branch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *                 example: New Address
 *     responses:
 *       200:
 *         description: Branch information updated successfully
 *       404:
 *         description: Branch not found
 *       500:
 *         description: Internal server error
 *
 *   delete:
 *     summary: Delete branch
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internal Branch ID
 *     responses:
 *       200:
 *         description: Branch deleted successfully
 *       400:
 *        description: Missing id
 *       404:
 *         description: Branch not found
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
