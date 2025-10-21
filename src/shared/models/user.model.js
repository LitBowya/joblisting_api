import {
    integer,
    pgTable,
    serial,
    timestamp,
    varchar,
    pgEnum,
    boolean,
} from "drizzle-orm/pg-core";

export const userType = pgEnum("user_type", ["job_seeker", "recruiter", "admin"]);

export const usersTable = pgTable("users_table", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    otp: varchar("otp", { length: 6}),
    otpVerified: boolean("otp_verified").default(false),
    otpExpiresIn: timestamp("otp_expires_in"),
    userType: userType("user_type").default("job_seeker").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .$onUpdate(() => new Date()),
});
