import { z } from "zod";

export const createProductSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Product name is required.")
        .max(100, "Product name cannot exceed 100 characters."),

    description: z
        .string()
        .trim()
        .max(5000, "Description cannot exceed 5000 characters.")
        .optional(),

    price: z
        .number()
        .min(0, "Price cannot be negative.")
});