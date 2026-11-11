import type { RequestEvent } from '@sveltejs/kit';
import { apiAction, apiJson, jsonRequest } from './api';
import type { Phase } from './tenants';

export type Image = {
    name: string;
    /** `remote` is always `images` (linuxcontainers.org): the server is not a free choice. */
    source: { name: string; remote?: string };
    aliases: string[];
    /** The SHA-256 of the image, once it is pulled. */
    fingerprint?: string;
    phase: Phase;
    /** What is wrong, as Incus says it. */
    problems?: string;
    createdAt: string;
    createdBy?: string;
};

const base = (tenant: string) => `/v1/tenants/${encodeURIComponent(tenant)}/images`;

/** The images of a tenant, by name. Anybody with a role on the tenant reads them. */
export const listImages = async (event: RequestEvent, tenant: string) =>
    (await apiJson<{ items: Image[] }>(event, base(tenant))).items;

/** One image. The deletion is asked from its page, which follows it while it is `Provisioning` or `Deleting`. */
export const getImage = (event: RequestEvent, tenant: string, name: string) =>
    apiJson<Image>(event, `${base(tenant)}/${encodeURIComponent(name)}`);

const NOT_OPERATOR = 'Only operators and administrators of this tenant can pull or delete images.';

/** The answer is 202: the image is `Provisioning` until it is pulled, which takes a few minutes for a virtual machine image. */
export const createImage = (
    event: RequestEvent,
    tenant: string,
    image: { name: string; source: { name: string }; aliases?: string[] }
) => apiAction<Image>(event, base(tenant), jsonRequest('POST', image), NOT_OPERATOR);

/**
 * The answer is 202. While an instance still starts from the image the API answers 409 and names the instances in its message;
 * for a few seconds after the last one is gone it still refuses, with a 409 that names nobody.
 */
export const deleteImage = (event: RequestEvent, tenant: string, name: string) =>
    apiAction<undefined>(
        event,
        `${base(tenant)}/${encodeURIComponent(name)}`,
        { method: 'DELETE' },
        NOT_OPERATOR
    );
