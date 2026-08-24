# Infrastructure and Deployment

## Initial hosting decision

The initial application should be hosted as a static GitHub Pages site and
deployed with GitHub Actions. This is free for a public repository using
standard GitHub-hosted runners.

No runtime infrastructure is required for the first release:

- No application server.
- No managed database.
- No user authentication.
- No private API keys in the browser.
- No always-running process.

The only recurring infrastructure work is building and publishing static files.

## GitHub Pages constraints

GitHub Pages supports custom Actions workflows. A deployment uses the official
Pages configuration, artifact upload, and deploy actions. The deploy job needs
`pages: write` and `id-token: write` permissions and should target the
`github-pages` environment.

GitHub currently documents a 1 GB published-site limit and a soft 100 GB monthly
bandwidth limit. Those limits should be ample if audio and textures are
compressed and large source art is not shipped in the production bundle.

References:

- [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [GitHub Pages limits](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/github-pages-limits)

GitHub Free only provides Pages for public repositories. If the source must
remain private, Cloudflare Pages is the recommended free alternative. Its free
plan currently provides free static asset requests and a documented allowance
of 500 builds per month.

- [Cloudflare Pages pricing](https://developers.cloudflare.com/pages/functions/pricing/)
- [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)

## Continuous integration

Pull requests should run a checks workflow containing:

1. Dependency installation using a locked dependency file.
2. Formatting verification.
3. Linting.
4. Type checking.
5. Content schema and reference validation.
6. Unit tests.
7. Production build.
8. A small browser smoke-test suite.

Full balance simulations and the complete browser suite may run on merges to
`main` or on a scheduled workflow if they become too slow for every pull
request.

## Deployment workflow

A push to `main` should:

1. Repeat all required checks rather than trusting an earlier local build.
2. Build the Vite application for the repository's Pages base path.
3. Upload the output directory as a Pages artifact.
4. Deploy it through the `github-pages` environment.
5. Report the production URL in the workflow summary.
6. Run a lightweight post-deployment smoke test.

The comprehensive Playwright suite remains local and runs before deployment.
After the Pages deploy job succeeds, a separate smoke job receives the exact
`page_url` output from `actions/deploy-pages`, opens that public URL without
starting a local server, and verifies the intro, Day 1 card, desktop shell, and
newspaper application. This keeps production verification small while ensuring
the uploaded asset paths and repository Pages base path actually work.

Deployment concurrency should cancel an obsolete queued build while preventing
two production deployments from racing.

## Browser routing and asset paths

Unless a custom domain is used, a project Pages site is served beneath a path
such as `/<repository-name>/`. Vite's base path must be configured accordingly.

The application should either use hash routing or avoid route-based navigation.
A server fallback cannot be assumed on GitHub Pages. Asset paths and service
worker scope must also honor the repository base path.

## Caching and offline behavior

Hashed production assets may be cached for a long time. The HTML entry point
and deployment metadata should be revalidated so a new version is discovered
quickly.

Offline play can be added after the basic deployment is stable. If a service
worker is introduced, it must provide a visible update process and must not trap
players indefinitely on an incompatible application version.

## Save safety during deployment

Save data lives in versioned first-party cookies and is not replaced by a
deployment. Large saves are split across bounded cookie chunks. Every release
that changes the schema must include tested migrations before deployment.

Recommended safeguards:

- Keep the previous readable schema for at least one release where practical.
- Back up a save internally before migrating it.
- Provide save export and import.
- Display a useful recovery message instead of deleting an invalid save.
- Never use content filenames or display names as persistent identity; use
  stable IDs.

## Secrets and security

The static application should contain no secrets. GitHub's built-in Pages token
and identity permissions are sufficient for deployment.

Dependencies should be pinned through the lockfile. Automated dependency
updates and code scanning can be enabled after the project is scaffolded. The
application should avoid inserting authored HTML directly into the DOM; content
markup should use a constrained renderer.

## Observability and privacy

The first version should work without analytics. Client-side error reporting or
anonymous play statistics should only be added with a clear data policy and an
explicit reason. A local debug export can provide the ruleset version, decision
history, triggered conditions, and error information without automatically
transmitting player data.

## Future backend option

If cloud features become necessary, preserve the static client and add a small
versioned API at the edge. Potential storage would contain accounts, encrypted
or access-controlled saves, aggregate decisions, or community content—not the
authoritative game logic.

That backend decision should include abuse controls, privacy policy, retention,
schema migrations, operational ownership, and a plan for leaving the service.
It should not be introduced only because the selected framework makes it easy.
