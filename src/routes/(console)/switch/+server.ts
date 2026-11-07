import { redirect } from '@sveltejs/kit';
import { TENANT_NAME } from '../../../params/tenant';
import type { RequestHandler } from './$types';

const SECTIONS = new Set(['', 'images', 'instances', 'members']);

// The tenant switcher is a plain form: this sends the person to the same section of the tenant they chose. Only an address of the
// console is built, from a checked name and a known section, never from what was sent.
export const GET: RequestHandler = ({ url }) => {
    const tenant = url.searchParams.get('tenant') ?? '';
    const section = url.searchParams.get('section') ?? '';
    if (!TENANT_NAME.test(tenant)) redirect(303, '/tenants');
    redirect(303, `/t/${tenant}${SECTIONS.has(section) && section ? `/${section}` : ''}`);
};
