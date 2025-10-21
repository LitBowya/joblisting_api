import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import {usersTable} from "../models/user.model.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.log('DATABASE_URL is not defined');
    throw new Error('DATABASE_URL is not defined');
}

export const db = drizzle(databaseUrl, {
    schema: {
        user: usersTable
    }
});
