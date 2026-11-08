# phorge-console

The web console of Phorge (`console.phorge.fr`), a SvelteKit application. The console is a web interface to the [Phorge API](https://github.com/phorge-fr/phorge-api): tenants, images, networks, profiles, instances and API keys.

The stack is chosen in [Hangar decision 0009](https://github.com/phorge-fr/Hangar/blob/main/docs/decisions/0009-build-the-frontend-with-sveltekit.md): SvelteKit with `adapter-node`, UnoCSS and pnpm. It runs on the `svc` cluster ([decision 0008](https://github.com/phorge-fr/Hangar/blob/main/docs/decisions/0008-keep-svc-and-host-the-frontend-on-it.md)).

This repository is a skeleton: the pages, the container image and the deployment are tracked in the issues linked from the [Roadmap](https://github.com/orgs/phorge-fr/projects/3).

## Build and run

You need Node 22 (see `.nvmrc`) and pnpm.

```bash
pnpm install
pnpm dev        # development server
pnpm check      # type check
pnpm lint       # formatting
pnpm build      # production build in build/
```

## Documentation

Pages are in [docs/](docs/README.md), grouped by what you want to do.

## Contributing

Every change starts from an issue and goes through a pull request; the rules (issue link, label, milestone, assignee, reviewer) are in the organization's [GOVERNANCE](https://github.com/phorge-fr/.github/blob/main/GOVERNANCE.md) and [CONTRIBUTING](https://github.com/phorge-fr/.github/blob/main/CONTRIBUTING.md). Planned work is on the public [Roadmap](https://github.com/orgs/phorge-fr/projects/3). Everyone taking part follows the [Code of Conduct](https://github.com/phorge-fr/.github/blob/main/CODE_OF_CONDUCT.md).

## Security

Report vulnerabilities privately, as described in the [security policy](https://github.com/phorge-fr/.github/blob/main/SECURITY.md). Do not open a public issue for them.

## License

Licensed under the [Apache License 2.0](LICENSE). Third-party packages are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
