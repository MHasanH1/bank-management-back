import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db";
import jwt from "jsonwebtoken";
import Controller from "./baseController";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user management endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user in the system (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - role_id
 *             properties:
 *               username:
 *                 type: string
 *                 example: employee_user
 *               password:
 *                 type: string
 *                 example: securePassword123
 *               role_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing fields or invalid role_id type
 *       401:
 *         description: Unauthorized (Token missing or invalid)
 *       403:
 *         description: Forbidden (Only Administrators can register users)
 *       404:
 *         description: Role not found
 *       409:
 *         description: Username already exists
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to the system and retrieve a token (JWT)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful and token returned
 *       400:
 *         description: Username and password are required
 *       401:
 *         description: Invalid username or password
 *       500:
 *         description: Internal server error
 */

class AuthController extends Controller {
  async registerUser(req: Request, res: Response): Promise<void> {
    const { username, password, role_id } = req.body;

    if (!username || !password || !role_id) {
      return this.errorResponse(
        res,
        400,
        "Username, password, and role_id are required.",
      );
    }

    if (typeof role_id !== "number") {
      return this.errorResponse(res, 400, "role_id must be a number.");
    }

    try {
      // 1. Check if username already exists
      const userCheck = await pool.query(
        "SELECT username FROM SystemUser WHERE username = $1",
        [username],
      );

      if (userCheck.rows.length > 0) {
        return this.errorResponse(
          res,
          409,
          "Username already exists. Please choose a different username.",
        );
      }

      // 2. Validate if the role_id actually exists in the Roles table
      const roleCheck = await pool.query(
        "SELECT role_id FROM Roles WHERE role_id = $1",
        [role_id],
      );

      if (roleCheck.rows.length === 0) {
        return this.errorResponse(
          res,
          404,
          "The specified role_id does not exist.",
        );
      }

      // 3. Hash password and insert user
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const query = `
            INSERT INTO SystemUser (username, password_hash, role_id)
            VALUES ($1, $2, $3)
            RETURNING user_id, username, role_id, created_at;
        `;
      const values = [username, passwordHash, role_id];
      const result = await pool.query(query, values);

      this.successResponse(
        res,
        201,
        "User registered successfully.",
        result.rows[0],
      );
    } catch (error: any) {
      console.error("Error in registration:", error);
      this.errorResponse(res, 500, "Internal server error.");
    }
  }

  async loginUser(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    if (!username || !password) {
      return this.errorResponse(
        res,
        400,
        "Username and password are required.",
      );
    }

    try {
      const query = `SELECT * FROM SystemUser WHERE username = $1;`;
      const result = await pool.query(query, [username]);

      if (result.rows.length === 0) {
        return this.errorResponse(res, 401, "Invalid username or password.");
      }

      const user = result.rows[0];

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return this.errorResponse(res, 401, "Invalid username or password.");
      }

      // Ensure JWT_SECRET is configured
      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is missing from environment variables.");
        return this.errorResponse(
          res,
          500,
          "Authentication configuration error.",
        );
      }

      const token = jwt.sign(
        { userId: user.user_id, roleId: user.role_id },
        process.env.JWT_SECRET,
        { expiresIn: "2h" },
      );

      this.successResponse(res, 200, "Login successful.", { token });
    } catch (error: any) {
      console.error("Error in login:", error);
      this.errorResponse(res, 500, "Internal server error.");
    }
  }
}

export default new AuthController();
