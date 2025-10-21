import {
    integer,
    pgTable,
    serial,
    timestamp,
    varchar,
    text,
    pgEnum,
    date,
    boolean,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user.model.js";


// Job Types Enum
export const jobTypeEnum = pgEnum("job_type", [
    "full_time",
    "part_time",
    "contract",
    "internship",
    "freelance",
]);

// Job Location Type Enum
export const jobLocationTypeEnum = pgEnum("job_location_type", [
    "on_site",
    "remote",
    "hybrid",
]);

// Job Status Enum
export const jobStatusEnum = pgEnum("job_status", [
    "open",
    "closed",
    "draft",
]);

// Job Application Status Enum
export const applicationStatusEnum = pgEnum("application_status", [
    "pending",
    "reviewed",
    "shortlisted",
    "rejected",
    "accepted",
]);

// Company/Recruiter Profile
export const companiesTable = pgTable("companies", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => usersTable.id, { onDelete: "cascade" }),
    companyName: varchar("company_name", { length: 255 }).notNull(),
    companyEmail: varchar("company_email", { length: 255 }),
    companyPhone: varchar("company_phone", { length: 20 }),
    website: varchar("website", { length: 255 }),
    industry: varchar("industry", { length: 100 }),
    location: varchar("location", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .$onUpdate(() => new Date()),
});

// Jobs/Job Listings
export const jobsTable = pgTable("jobs", {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
        .notNull()
        .references(() => companiesTable.id, { onDelete: "cascade" }),
    recruiterId: integer("recruiter_id")
        .notNull()
        .references(() => usersTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    jobType: jobTypeEnum("job_type").notNull(),
    locationType: jobLocationTypeEnum("location_type").notNull(),
    location: varchar("location", { length: 255 }),
    deadline: date("deadline"),
    status: jobStatusEnum("status").default("open").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .$onUpdate(() => new Date()),
});

// Job Skills Required
export const jobSkillsTable = pgTable("job_skills", {
    id: serial("id").primaryKey(),
    jobId: integer("job_id")
        .notNull()
        .references(() => jobsTable.id, { onDelete: "cascade" }),
    skillName: varchar("skill_name", { length: 100 }).notNull(),
    isRequired: boolean("is_required").default(true), // true for required, false for nice-to-have
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Job Applications
export const jobApplicationsTable = pgTable("job_applications", {
    id: serial("id").primaryKey(),
    jobId: integer("job_id")
        .notNull()
        .references(() => jobsTable.id, { onDelete: "cascade" }),
    jobSeekerId: integer("job_seeker_id")
        .notNull()
        .references(() => usersTable.id, { onDelete: "cascade" }),
    status: applicationStatusEnum("status").default("pending").notNull(),
    appliedAt: timestamp("applied_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .$onUpdate(() => new Date()),
});
