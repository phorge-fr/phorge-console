import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// The tenants are the home of the console, at `/`. This address was its first name: it is kept so that a link to it still works.
export const GET: RequestHandler = () => redirect(308, '/');
