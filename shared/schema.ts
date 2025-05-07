import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  company: text("company").notNull(),
  employeeCount: text("employee_count").notNull(),
  industry: text("industry").notNull(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  company: true,
  employeeCount: true,
  industry: true,
  password: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  name: true,
  password: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;
