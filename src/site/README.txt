# The showcase page, set aside

The showcase site (`phorge.fr`) is not served by this application for now: `/` is the home of the console. Its page, its layout and its prerender setting are kept here, outside `src/routes`, so that nothing routes to them, and can be put back under a route (or into the repository that hosts the showcase site) when that is decided. The header and footer components are still in `src/lib/components`.
