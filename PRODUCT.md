# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who use Phorge to get virtual machines for their own work, without knowing how the platform is built: researchers, students and small teams. They sign in with their Phorge account, land on the tenants they belong to and, inside a tenant, pull an image and start a virtual machine. They are not infrastructure specialists: the words Incus, OpenFGA and Crossplane mean nothing to them. A few platform administrators (the Phorge team) also use the console to create tenants and change their plan; they are comfortable with technical detail, which stays one click away rather than being the default.

## Product Purpose

The web console of Phorge (`console.phorge.fr`) is the interface to the Phorge API: tenants, images, instances (virtual machines), members and API keys. It exists so that a person gets a working virtual machine in a few minutes without the command line, and can see at any moment what exists, what state it is in and why something failed. Success is a person who creates, starts, resizes and deletes a machine without help and without fear of destroying something by accident.

## Positioning

Phorge is an open-source cloud provider where every line of configuration, automation and infrastructure logic is visible, auditable and open to contribution. The console is part of that: its source is public, and what it shows (states, problems as the platform reports them, quotas) is the real state of the platform, not a simplified view.

## Operating Context

- Used in a desktop browser for the work itself, and on a phone to check a state or start and stop a machine.
- Sign-in is delegated to Authentik; the session lives on the server and no token reaches the browser.
- Creating and deleting things takes seconds to minutes and is asynchronous: the console follows a tenant, an image or an instance from `Provisioning` to `Ready`, `Failed` or gone.
- The API refuses what the person's role does not allow; it does not yet say which role the person holds on a tenant (phorge-fr/phorge-api#65, phorge-fr/phorge-console#30).

## Capabilities and Constraints

- Views that exist: tenants home, new tenant, one tenant (overview, plan, deletion), images, instances (list, create, one instance with power, size, SSH keys, deletion), account. Members and API keys are not built yet (#15, #18).
- Everything the API offers is asynchronous and returns a phase: `Provisioning`, `Ready`, `Failed`, `Deleting`. A `Failed` instance is stuck and has to be deleted and created again.
- Destructive actions need the person to type the exact name; the server checks it.
- Server-rendered SvelteKit with no token in client-side code; the forms work without JavaScript and JavaScript only adds following states and polling.
- English interface. The showcase site of `phorge.fr` is a separate project and is not part of this repository.
- The platform names (Incus, OpenFGA, Crossplane, namespaces) are implementation details and are not shown to the person unless they explain a problem the platform reports.

## Brand Commitments

The name is written **Phorge**. The logo files, the typeface (Source Sans 3, self-hosted: no third-party font host) and the blue of the logo are kept, and the light and dark themes stay. The brand guide ([phorge-fr/.github](https://github.com/phorge-fr/.github/blob/main/docs/reference/brand-guide.md)) is not binding in full for the console: the console may extend it with status colours, an icon set and more neutral tints, which are then written back into the brand guide. Contrast stays at WCAG AA or better.

## Evidence on Hand

- The six implemented views, in `src/routes/(console)/`.
- The brand assets in `static/brand/` and the tokens in `src/lib/styles/tokens.css`.
- No usage data, no user research and no testimonials exist; none are invented.

## Product Principles

1. **A person who has never seen a cloud console succeeds.** Plain words, a clear next step on every screen, and a sensible default for every choice.
2. **State is always visible and always honest.** What exists, what it is doing and why it failed is shown as the platform reports it, and the page follows what is in progress.
3. **Nothing destructive happens by accident.** Deletions say what goes with them and cannot be done in one click.
4. **Calm and minimal.** Low noise, few choices at a time, detail on demand: it matches the platform's own promise of minimalism.
5. **Transparent.** Technical detail is one click away for those who want it, and the console hides nothing the platform knows.

## Accessibility & Inclusion

WCAG 2.2 AA at least: keyboard-only use of every action, visible focus, state never carried by colour alone, both themes at the contrast of the brand guide or better, and phone widths from 360 px.
