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
 *         description: Customer's national ID
 *     responses:
 *       200:
 *         description: Customer information found
 *       404:
 *         description: Customer not found
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
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone_number:
 *                 type: string
 *                 example: "09999999999"
 *               address:
 *                 type: string
 *                 example: New Address
 *     responses:
 *       200:
 *         description: Customer information updated
 */

class CustomerController extends Controller {
  async addCustomer(req: Request, res: Response): Promise<void> {
    const { first_name, last_name, national_id, phone_number, address } =
      req.body;

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
      res
        .status(201)
        .json({
          message: "Customer added successfully.",
          customer: result.rows[0],
        });
    } catch (error: any) {
      console.error("Error adding customer:", error);
      res.status(500).json({ error: "Error occurred while adding customer." });
    }
  }

  async searchCustomer(req: Request, res: Response): Promise<void> {
    const { national_id } = req.query;

    try {
      const query = `SELECT * FROM Customer WHERE national_id = $1;`;
      const result = await pool.query(query, [national_id]);

      if (result.rows.length === 0) {
        res.status(404).json({ message: "Customer not found." });
        return;
      }

      res.status(200).json(result.rows[0]);
    } catch (error: any) {
      console.error("Error searching customer:", error);
      res
        .status(500)
        .json({ error: "Error occurred while searching for customer." });
    }
  }

  async updateCustomer(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { phone_number, address } = req.body;

    try {
      const query = `
              UPDATE Customer 
              SET phone_number = $1, address = $2 
              WHERE customer_id = $3 
              RETURNING *;
          `;
      const result = await pool.query(query, [phone_number, address, id]);

      res
        .status(200)
        .json({
          message: "Customer information updated.",
          customer: result.rows[0],
        });
    } catch (error: any) {
      console.error("Error updating customer:", error);
      res
        .status(500)
        .json({ error: "Error occurred while updating customer information." });
    }
  }
}

export default new CustomerController();
