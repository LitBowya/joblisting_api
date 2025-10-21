import 'dotenv/config';


import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {usersTable} from "../models/user.model.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.log('DATABASE_URL is not defined');
    throw new Error('DATABASE_URL is not defined');
}

const sql = neon(databaseUrl);

export const db = drizzle({client: sql}, {
    schema: {
        user: usersTable
    }
});
