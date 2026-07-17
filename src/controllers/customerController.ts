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
 *   put:
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
 */

class CustomerController extends Controller {
  async addCustomer(req: Request, res: Response): Promise<void> {
    const { first_name, last_name, national_id, phone_number, address } =
      req.body;

    if (!first_name || !last_name || !national_id || !phone_number) {
      return this.errorResponse(
        res,
        400,
        "First name, last name, national ID, and phone number are required.",
      );
    }

    try {
      const query = `
          INSERT INTO Customer (first_name, last_name, national_id, phone_number, address)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *;
      `;
      const values = [
        first_name,
        last_name,
        national_id,
        phone_number,
        address,
      ];
      const result = await pool.query(query, values);

      this.successResponse(
        res,
        201,
        "Customer added successfully.",
        result.rows[0],
      );
    } catch (error: any) {
      // Handle Postgres unique constraints violation (code 23505)
      if (error.code === "23505") {
        return this.errorResponse(
          res,
          409,
          "A customer with this National ID or Phone Number already exists.",
        );
      }

      console.error("Error adding customer:", error);
      this.errorResponse(res, 500, "Error occurred while adding customer.");
    }
  }

  async searchCustomer(req: Request, res: Response): Promise<void> {
    const { national_id } = req.query;

    if (!national_id) {
      return this.errorResponse(
        res,
        400,
        "National ID query parameter is required.",
      );
    }

    try {
      const query = `SELECT * FROM Customer WHERE national_id = $1;`;
      const result = await pool.query(query, [national_id]);

      if (result.rows.length === 0) {
        return this.errorResponse(res, 404, "Customer not found.");
      }

      this.successResponse(
        res,
        200,
        "Customer information found.",
        result.rows[0],
      );
    } catch (error: any) {
      console.error("Error searching customer:", error);
      this.errorResponse(
        res,
        500,
        "Error occurred while searching for customer.",
      );
    }
  }

  async updateCustomer(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { phone_number, address } = req.body;

    if (!phone_number) {
      return this.errorResponse(
        res,
        400,
        "Phone number is required for update.",
      );
    }

    try {
      const query = `
          UPDATE Customer 
          SET phone_number = $1, address = $2 
          WHERE customer_id = $3 
          RETURNING *;
      `;
      const result = await pool.query(query, [phone_number, address, id]);

      // If no rows affected, means customer_id didn't exist
      if (result.rows.length === 0) {
        return this.errorResponse(res, 404, "Customer not found.");
      }

      this.successResponse(
        res,
        200,
        "Customer information updated.",
        result.rows[0],
      );
    } catch (error: any) {
      // Handle unique key constraint if someone updates to a phone number owned by another customer
      if (error.code === "23505") {
        return this.errorResponse(
          res,
          409,
          "This phone number is already in use by another customer.",
        );
      }

      console.error("Error updating customer:", error);
      this.errorResponse(
        res,
        500,
        "Error occurred while updating customer information.",
      );
    }
  }
}

export default new CustomerController();
