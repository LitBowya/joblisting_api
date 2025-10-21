import { db } from "../../../shared/db/index.js";
import { jobSeekerProfilesTable, skillsTable } from "../../../shared/models/jobSeeker.model.js";
import { eq } from "drizzle-orm";

/**
 * Get job seeker profile by user ID
 * @param {number} userId - User ID
 * @returns {Promise<object|null>}
 */
export const getProfileByUserId = async (userId) => {
    try {
        const [profile] = await db
            .select()
            .from(jobSeekerProfilesTable)
            .where(eq(jobSeekerProfilesTable.userId, userId))
            .limit(1);

        return profile || null;
    } catch (error) {
        console.error("Error fetching profile by user ID:", error);
        return null;
    }
};

/**
 * Check if skill already exists for profile
 * @param {number} profileId - Profile ID
 * @param {string} skillName - Skill name
 * @returns {Promise<boolean>}
 */
export const hasSkill = async (profileId, skillName) => {
    try {
        const [skill] = await db
            .select()
            .from(skillsTable)
            .where(eq(skillsTable.profileId, profileId))
            .where(eq(skillsTable.skillName, skillName))
            .limit(1);

        return !!skill;
    } catch (error) {
        console.error("Error checking skill existence:", error);
        return false;
    }
};

/**
 * Get all skills for a profile
 * @param {number} profileId - Profile ID
 * @returns {Promise<Array>}
 */
export const getProfileSkills = async (profileId) => {
    try {
        const skills = await db
            .select()
            .from(skillsTable)
            .where(eq(skillsTable.profileId, profileId));

        return skills;
    } catch (error) {
        console.error("Error fetching profile skills:", error);
        return [];
    }
};

