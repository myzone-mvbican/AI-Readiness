
import { Request, Response } from "express";
import { UserModel } from "../models/user.model";
import { storage } from "../storage";

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await UserModel.findByEmail(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const isPasswordValid = await storage.validatePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      const token = storage.generateToken(user);
      const { password: _, ...userWithoutPassword } = user;

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "Login failed due to an unexpected error",
      });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const existingUser = await UserModel.findByEmail(req.body.email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "A user with this email already exists",
        });
      }

      const user = await UserModel.create(req.body);
      const token = storage.generateToken(user);
      const { password, ...userWithoutPassword } = user;

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({
        success: false,
        message: "Registration failed due to an unexpected error",
      });
    }
  }
}
