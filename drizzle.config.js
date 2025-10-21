import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.log('DATABASE_URL is not defined');
    throw new Error('DATABASE_URL is not defined');
}

export default defineConfig({
    out: './drizzle',
    schema: './src/shared/models/*.js',
    dialect: 'postgresql',
    dbCredentials: {
        url: databaseUrl,
    }
})
