import { db } from "../../../shared/db/index.js";
import { usersTable } from "../../../shared/models/user.model.js";
import { eq, ilike, or, and, count, ne } from "drizzle-orm";

/**
 * Get user by ID (excluding password)
 */
export const getUserById = async userId => {
    try {
        const [user] = await db
            .select({
                id: usersTable.id,
                name: usersTable.name,
                email: usersTable.email,
                userType: usersTable.userType,
                otpVerified: usersTable.otpVerified,
                createdAt: usersTable.createdAt,
                updatedAt: usersTable.updatedAt,
            })
            .from(usersTable)
            .where(eq(usersTable.id, userId))
            .limit(1);

        return user || null;
    } catch (error) {
        throw new Error(`Error fetching user: ${error.message}`);
    }
};

export const getUserByIdWithPassword = async userId => {
    try {
        const [user] = await db
            .select({
                id: usersTable.id,
                name: usersTable.name,
                email: usersTable.email,
                password: usersTable.password,
                userType: usersTable.userType,
                otpVerified: usersTable.otpVerified,
                createdAt: usersTable.createdAt,
                updatedAt: usersTable.updatedAt,
            })
            .from(usersTable)
            .where(eq(usersTable.id, userId))
            .limit(1);

        return user || null;
    } catch (error) {
        throw new Error(`Error fetching user: ${error.message}`);
    }
};

/**
 * Check if email is already taken by another user
 */
export const isEmailTaken = async (email, excludeUserId = null) => {
    try {
        const whereConditions = [eq(usersTable.email, email)];

        if (excludeUserId) {
            whereConditions.push(ne(usersTable.id, excludeUserId));
        }

        const [existingUser] = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(and(...whereConditions))
            .limit(1);

        return !!existingUser;
    } catch (error) {
        throw new Error(`Error checking email availability: ${error.message}`);
    }
};

/**
 * Get user statistics
 */

