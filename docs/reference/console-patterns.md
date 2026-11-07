---
type: reference
audience: developer who adds a view to the console
verified: 2026-11-07
---

# Console patterns

What every view of the console shares, so that a new one looks and behaves like the others. The addresses are in the [configuration reference](configuration.md#routes) and the look in the [design system](design-system.md).

## The frame

Every page of the console is under `src/routes/(console)/`, and its layout draws the frame: the header with the tenant switcher and the sign-out button, then the navigation of the sections.

- The tenant is in the address: `/t/<tenant>/<section>`. The choice is never kept anywhere else, so a link, a bookmark or a reload shows the same thing.
- The layout loads the tenants the person can see (`GET /v1/tenants`). If that call fails, the frame still shows, with a notice, so that the person can sign out; the page that needs the API reports the failure itself.
- The tenant switcher is a plain form to `GET /switch`: it works without JavaScript and keeps the section the person is in.
- Views that belong to a tenant go under `src/routes/(console)/t/[tenant=tenant]/`. Its layout loads the tenant, and `data.tenant` is available to them. `[tenant=tenant]` only matches a name the API could accept.
- `/` is the home of the console. The showcase page, with its own header and footer, is set aside in `src/site/` and is not served.

## States

A view tells the person what happens in plain words, and offers a way out. Colour never carries the meaning alone: the brand has no status colours, so the state is written (`Ready`, `Failed`) next to a mark.

| State | How it is shown |
| --- | --- |
| Loading | A bar under the navigation while the next page is fetched, and the words "Loading…" for a screen reader. |
| Empty | `EmptyState`: what the thing is, and who can create it. |
| Not built yet | `ComingNext`: it says so and points at the issue, so that an unfinished view never looks like an empty one. |
| Forbidden (`403`) | `+error.svelte` of the console: "You are not allowed to do this" and a link to the tenants. |
| Not found (`404`) | "Not found". A tenant that does not exist and one the person cannot see are the same answer, as the API gives them. |
| Unavailable (`503`, any `5xx`, the API cannot be reached) | "Temporarily unavailable", with "Try again". |
| Signed out (`401`) | The person is sent to sign in and comes back to the same page. |

`apiJson` (`#lib/server/api`) turns what the API answers into these, so a view only calls it and lets the error go.

## Destructive actions

Nothing is deleted by one click. `ConfirmDelete` is the pattern for a tenant, an image, an instance or a key:

1. A closed panel, "Delete this `<what>`…", so that the button is not next to the others.
2. When opened, it says in plain words what goes with it and that it cannot be undone.
3. The person types the exact name. The browser checks it (the field has a `pattern`), but only the server counts: the action of the page must call `isConfirmed(await request.formData(), name)` from `#lib/server/confirm` before it deletes, and answer `400` when it is false.
4. The submit button names the action ("Delete the tenant").

It is a `<details>` and a `POST` form, so it works without JavaScript, and the cross-site check of SvelteKit protects it like every form.

```svelte
<ConfirmDelete
    name={data.tenant.name}
    what="tenant"
    consequence="Its images, its virtual machines and its members are deleted with it."
/>
```
