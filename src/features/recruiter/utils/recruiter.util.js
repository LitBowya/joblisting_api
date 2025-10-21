import { db } from "../../../shared/db/index.js";
import { companiesTable } from "../../../shared/models/recruiter.model.js";
import { eq } from "drizzle-orm";

/**
 * Check if user owns the company
 * @param {number} userId - User ID
 * @param {number} companyId - Company ID
 * @returns {Promise<boolean>}
 */
export const isCompanyOwner = async (userId, companyId) => {
    try {
        const [company] = await db
            .select()
            .from(companiesTable)
            .where(eq(companiesTable.id, companyId))
            .limit(1);

        return company && company.userId === userId;
    } catch (error) {
        console.error("Error checking company ownership:", error);
        return false;
    }
};

/**
 * Get company by user ID
 * @param {number} userId - User ID
 * @returns {Promise<object|null>}
 */
export const getCompanyByUserId = async (userId) => {
    try {
        const [company] = await db
            .select()
            .from(companiesTable)
            .where(eq(companiesTable.userId, userId))

        return company || null;
    } catch (error) {
        console.error("Error fetching company by user ID:", error);
        return null;
    }
};

/**
 * Check if company name already exists (excluding current company)
 * @param {string} companyName - Company name to check
 * @param {number|null} excludeCompanyId - Company ID to exclude from check
 * @returns {Promise<boolean>}
 */
export const isCompanyNameTaken = async (companyName, excludeCompanyId = null) => {
    try {
        let query = db
            .select()
            .from(companiesTable)
            .where(eq(companiesTable.companyName, companyName));

        const companies = await query;

        if (excludeCompanyId) {
            return companies.some((c) => c.id !== excludeCompanyId);
        }

        return companies.length > 0;
    } catch (error) {
        console.error("Error checking company name:", error);
        return false;
    }
};

