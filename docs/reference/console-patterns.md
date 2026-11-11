---
type: reference
audience: developer who adds a view to the console
verified: 2026-11-11
---

# Console patterns

What every view of the console shares, so that a new one looks and behaves like the others. The addresses are in the [configuration reference](configuration.md#routes) and the look in the [design system](design-system.md).

## The frame

Every page of the console is under `src/routes/(console)/`, and its layout draws the frame: a side column with the tenant menu, the sections, the account and the sign-out button (a bar with a menu button on a phone). A page starts with `PageHeader`.

- The tenant is in the address: `/t/<tenant>/<section>`. The choice is never kept anywhere else, so a link, a bookmark or a reload shows the same thing.
- The layout loads the tenants the person can see (`GET /v1/tenants`). If that call fails, the frame still shows, with a notice, so that the person can sign out; the page that needs the API reports the failure itself.
- The tenant menu is a `<details>` of plain links to `GET /switch`: it works without JavaScript and keeps the section the person is in.
- Views that belong to a tenant go under `src/routes/(console)/t/[tenant=tenant]/`. Its layout loads the tenant, and `data.tenant` is available to them. `[tenant=tenant]` only matches a name the API could accept.
- `/` is the home of the console. The showcase site lives in its own repository.

## States

A view tells the person what happens in plain words, and offers a way out. Colour never carries the meaning alone: the brand has no status colours, so the state is written (`Ready`, `Failed`) next to a mark.

| State | How it is shown |
| --- | --- |
| Loading | A bar under the navigation while the next page is fetched, and the words "Loading…" for a screen reader. |
| Empty | `EmptyState`: what the thing is, and what to do about it, see [the empty state of a list](#the-list). |
| Not built yet | `ComingNext`: it says so and points at the issue, so that an unfinished view never looks like an empty one. |
| Forbidden (`403`) | `+error.svelte` of the console: "You are not allowed to do this" and a link to the tenants. |
| Not found (`404`) | "Not found". A tenant that does not exist and one the person cannot see are the same answer, as the API gives them. |
| Unavailable (`503`, any `5xx`, the API cannot be reached) | "Temporarily unavailable", with "Try again". |
| Signed out (`401`) | The person is sent to sign in and comes back to the same page. |
| In progress (`Provisioning`, `Deleting`, a start or a stop) | The page follows it: `AutoRefresh` reloads a list and the page of an object, and the page of a tenant polls `/t/<tenant>/status` and reloads when the state changes, or goes home when the tenant is gone. It stops after a quarter of an hour. |

`apiJson` (`#lib/server/api`) turns what the API answers into these, so a view only calls it and lets the error go.

## Lists and pages of objects

Every kind the console manages (a tenant, an instance, a network, an image, a profile, an API key) has the same two views: a list and a page per object. A list is read-only. Everything that changes an object, including its deletion, is done on its page. The views that do not follow this yet are tracked in [phorge-console#68](https://github.com/phorge-fr/phorge-console/issues/68).

### The list

The list of a kind is `…/<kind>`: `/` for the tenants, and `/t/<tenant>/<kind>` for the others.

| Part | Rule |
| --- | --- |
| Header | `PageHeader` with the title, one sentence on what the kind is, and **one** action on the right: Create, a `btn-primary` link to `…/new` with a plus icon. Nothing else is in the header. |
| Create label | "Create a `<what>`" (`Create a network`, `Create an instance`, `Create a profile`, `Create a key`). The one exception is "Pull an image", which is what happens. |
| Create hidden | The action is left out when the console knows the person cannot create the kind (`canCreateTenants`). Otherwise it is offered to everybody and the API refuses, see [Forms](#forms). |
| Row | One table row per object; the table stacks on a phone. The name is a link to the page of the object, stretched over the whole row (`relative` row, `after:absolute after:inset-0` on the link), as the tenants and the instances do. |
| What a row shows | The state (`PhaseBadge`, `InstanceStatus`) and up to three facts that tell objects apart or that a person scans for: a size, a range, an address, a source, a date. A technical name is shown only as the small second line under the name. |
| What a row never has | A button, a form, an `Edit` link, a `Delete` link or a `Revoke` link, and no address (`?delete=`, `?rename=`) that opens a form above the list. Reading the list changes nothing. |
| What is wrong | When the platform reports `problems` for an object, a line under its row shows them in an `Alert` titled "What is wrong". |
| Empty | `EmptyState`: what the kind is and what it is for, in a sentence, and who can create it when the person may not. It holds no second Create button, since the header has it. A kind that always has rows (the built-in profiles `s`, `m` and `l`) has no empty state. |
| In progress | `AutoRefresh` is active while a row is `Provisioning` or `Deleting` (or an instance is starting or stopping), so that the list follows by itself. |
| Not built yet | `ComingNext` in place of the list, with no Create action. |

### The page of an object

The page is at `…/<kind>/<name>` (`/t/<name>` for a tenant). The name is checked by a parameter matcher before the API is called, so a name the API could not have given is a `404` and `new` never reaches the page of an object. A kind therefore refuses `new` as a name when it is created (instances and networks do).

| Part | Rule |
| --- | --- |
| Header | `PageHeader` with the name as the title, the state as `status`, and a back link to the list ("All instances"). The actions on the right are those that act on the object as it runs (`Start`, `Stop`, `Terminal`), never an edit or a deletion. |
| Notices | Under the header: what is wrong (`problems`), and one `Alert` for the state in progress or lost: what is happening and that the page follows it, or what to do with an object that failed. |
| Overview | The first `SettingsSection`: a `dl` with every fact of the object, those of the row and the others (who made it and when, what it is attached to). An object another one refers to (the network of an instance, the image or the profile of an instance, the instances of an image) is a link to its page. |
| Edit | One `SettingsSection` per thing that can change, with its own form that posts to a named action of the page (`?/resize`, `?/keys`). The form is filled with what the object has, or with what the person typed when the API refused. |
| Delete | The last `SettingsSection`, titled "Delete this `<what>`", holding `ConfirmDelete`. It is the only place a deletion starts. |
| In progress | The page follows the object (`AutoRefresh`, or the poll of the tenant). While the object is `Provisioning` the sections that cannot work yet are left out; while it is `Deleting` the edit and delete sections are left out and the notice says so. |
| Failed | The page says what is wrong. When the object cannot recover (an instance that failed to start for the first time), the notice says to delete it and create it again, and the delete section stays. |
| Refused | The sentence of the API is shown as it is, next to the form that sent it (`form.<action>.message`), and what the person typed is kept. A refused deletion is shown above `ConfirmDelete`, in the section of the deletion. The console never stops, starts or moves something else to make a change possible: it says what to do. |

### A kind with nothing to edit

The page exists anyway, because the name in the list links to it. It holds the overview and, when the kind can be deleted, the delete section.

- Where the form would be, there is no disabled form. A section titled like the edit says in one sentence that the object cannot change and what to do instead (an image is deleted and pulled again; a profile is made again and the machines are moved to it).
- When an issue tracks the edit, the sentence points at it as `ComingNext` does.
- An object that cannot be deleted (a built-in profile) has no delete section, and its overview says that it is built in and cannot be changed or deleted.

### After a creation and a deletion

| Action | Where the person lands |
| --- | --- |
| Creation | A `303` to the page of the new object, which follows it until it is ready (`/t/<name>`, `/t/<tenant>/instances/<name>`). The exception is an API key: the key is shown once, so the answer of the `POST` is the page that shows it, sent with `Cache-Control: no-store`, with a link back to the list. |
| Deletion | A `303` to the list of the kind, where the row follows the object in `Deleting` until it is gone. The list of instances also shows a notice from `?deleted=<name>` that says what became of the machine. A tenant stays on its own page, which follows it and goes home when the tenant is gone. |

## Forms

Creating something is a page of its own, `…/new` under the list it adds to (`/new` for a tenant, `/api-keys/new`, `/t/<tenant>/images/new`, `/t/<tenant>/networks/new`, `/t/<tenant>/profiles/new`, `/t/<tenant>/instances/new`): it has its own address, so that the back button, a link and a reload work, and the list stays a list. The Create action in the header of the list leads to it, see [the list](#the-list). A name that the console uses as a path segment (`new`) is refused when an object is created.

A form posts to an action of its page, and the action calls `apiAction` instead of `apiJson`: what the person can fix (a bad name, a name already taken, a refusal) comes back as a message next to the form, with what they typed kept, and a `403` is explained with the words given for that action. The action checks what it can first, in plain words, and the API checks it all again. After a creation or a deletion the person is redirected to the page that follows the result, never left on a `POST`, see [after a creation and a deletion](#after-a-creation-and-a-deletion).

What is offered follows who the person is: the layout loads `canCreateTenants` from `GET /v1/whoami`, and the creation of a tenant is only offered when it is true. There is no platform administrator in the API: the other actions are offered to everybody, and a `403` is explained next to the form. That only hides what would be refused; the API refuses it either way.

The token is renewed once at a time (`#lib/server/api`): the layout and the page of a route load in parallel, and a second renewal with the same refresh token would be refused and sign the person out.

## Destructive actions

Nothing is deleted by one click, and nothing is deleted from a list. `ConfirmDelete` is the pattern for the deletion of a tenant, an instance, a network, an image, a profile and a key, and it sits in the last section of the page of the object:

1. A closed panel, "Delete this `<what>`…", so that the button is not next to the others.
2. When opened, it says in plain words what goes with it and that it cannot be undone.
3. The person types the exact name. The browser checks it (the field has a `pattern`), but only the server counts: the action of the page must call `isConfirmed(await request.formData(), name)` from `#lib/server/confirm` before it deletes, and answer `400` when it is false.
4. The submit button names the action ("Delete the tenant").

It is a `<details>` and a `POST` form to the action `?/delete` of the page, so it works without JavaScript, and the cross-site check of SvelteKit protects it like every form. Its consequence names what the API refuses, in the API's words when it can (a network with a machine attached, an image or a profile that a machine uses), and the page shows a refusal above the panel.

```svelte
<ConfirmDelete
    name={data.tenant.name}
    what="tenant"
    consequence="Its images, its virtual machines and its members are deleted with it."
/>
```
