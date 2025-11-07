import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { building } from '$app/environment';

// Use a dummy client during the build process to prevent connection errors
const getClient = () => {
	if (building) {
		// A dummy object that satisfies the type but does nothing.
		return {
			execute: async () => ({ columns: [], rows: [] }),
			batch: async () => []
		} as any;
	}

	const url = process.env.NODE_ENV === 'production' ? 'file:/data/sqlite.db' : 'file:../sqlite.db';
	return createClient({ url });
};

export const db = drizzle(getClient(), { schema });

export type DB = typeof db;