import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access denied: No token provided." });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      res.status(403).json({ error: "Invalid or expired token." });
      return;
    }
    req.user = user;
    next();
  });
};

export const authorizeRole = (requiredRoleId: number) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.roleId > requiredRoleId) {
      res.status(403).json({
        error:
          "You do not have the required permissions to perform this action.",
      });
      return;
    }
    next();
  };
};
