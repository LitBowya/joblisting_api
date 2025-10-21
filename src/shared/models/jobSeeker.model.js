import {
    integer,
    pgTable,
    serial,
    timestamp,
    varchar,
    text,
    pgEnum,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user.model.js";

// Skill Proficiency Level Enum
export const proficiencyLevelEnum = pgEnum("proficiency_level", [
    "Beginner",
    "Intermediate",
    "Advanced",
    "Expert",
]);

// Job Seeker Profile
export const jobSeekerProfilesTable = pgTable("job_seeker_profiles", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => usersTable.id, { onDelete: "cascade" })
        .unique(),
    phone: varchar("phone", { length: 20 }),
    location: varchar("location", { length: 255 }),
    bio: text("bio"),
    yearsOfExperience: integer("years_of_experience").default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .$onUpdate(() => new Date()),
});

// Skills
export const skillsTable = pgTable("skills", {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
        .notNull()
        .references(() => jobSeekerProfilesTable.id, { onDelete: "cascade" }),
    skillName: varchar("skill_name", { length: 100 }).notNull(),
    proficiencyLevel: proficiencyLevelEnum("proficiency_level"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
