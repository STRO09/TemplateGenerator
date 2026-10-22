import { z } from "zod";

/**
 * Validation schema for user login.
 */
export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Invalid email address."),

    password: z
        .string()
        .min(1, "Password is required.")
});

/**
 * Validation schema for user registration.
 */
export const registerSchema = z.object({
    // firstName: z
    //     .string()
    //     .trim()
    //     .min(1, "First name is required."),

    // lastName: z
    //     .string()
    //     .trim()
    //     .min(1, "Last name is required."),

    email: z
        .string()
        .trim()
        .email("Invalid email address."),

    password: z
        .string()
        .min(8, "Password must contain at least 8 characters.")
});