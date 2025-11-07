import type { Config } from 'drizzle-kit';

export default {
	schema: './src/lib/server/db/schema.ts',
	out: './migrations',
	dialect: 'sqlite', // 'sqlite' is also used for libSQL
	dbCredentials: {
		url:
			process.env.NODE_ENV === 'production'
				? 'file:/data/sqlite.db' // Path for Docker volume
				: 'file:../sqlite.db' // Local development path
	}
} satisfies Config;
