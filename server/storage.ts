import { users, type User, type InsertUser, type UpdateUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Create a JWT_SECRET if not already set
if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET not set. Using a default secret for development. DO NOT USE THIS IN PRODUCTION!");
  process.env.JWT_SECRET = "myzone-ai-dev-secret-2025";
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: UpdateUser): Promise<User | undefined>;
  validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
  generateToken(user: User): string;
  verifyToken(token: string): { userId: number } | null;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await this.hashPassword(insertUser.password);
    
    // Create the new user with hashed password and handle optional fields
    const [user] = await db
      .insert(users)
      .values({
        name: insertUser.name,
        email: insertUser.email,
        password: hashedPassword,
        company: insertUser.company || null,
        employeeCount: insertUser.employeeCount || null,
        industry: insertUser.industry || null,
        updatedAt: new Date()
      })
      .returning();
      
    return user;
  }

  async updateUser(id: number, userData: UpdateUser): Promise<User | undefined> {
    // Hash the password if provided
    let updatedUserData = { ...userData };
    
    if (userData.password) {
      updatedUserData.password = await this.hashPassword(userData.password);
    }
    
    // Update with the current timestamp
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updatedUserData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
      
    return updatedUser;
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token: string): { userId: number } | null {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      return decoded;
    } catch (error) {
      return null;
    }
  }
}

// For backward compatibility with existing code
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const hashedPassword = await this.hashPassword(insertUser.password);
    const user: User = { 
      id,
      name: insertUser.name, 
      email: insertUser.email,
      password: hashedPassword,
      company: insertUser.company || null,
      employeeCount: insertUser.employeeCount || null,
      industry: insertUser.industry || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: UpdateUser): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    // Hash password if provided
    if (userData.password) {
      userData.password = await this.hashPassword(userData.password);
    }

    const updatedUser = { 
      ...existingUser, 
      ...userData, 
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token: string): { userId: number } | null {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      return decoded;
    } catch (error) {
      return null;
    }
  }
}

// Change this to use DatabaseStorage
export const storage = new DatabaseStorage();
