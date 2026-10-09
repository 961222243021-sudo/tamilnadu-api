# Deployment status

Prepared on 2026-10-09. **Not deployed. No public API hostname has been assigned.**

The connected Vercel account returned HTTP 403 when creating the `tamilnadu-api` project: “You don't have permission to create the project.” The environment has no Vercel CLI credentials available for a fallback.

Create/import the project using an account with project-creation permission. Follow README.md. Suggested name: `tamilnadu-api`; framework Other; Node 24.x; build `npm run build`; output `public`; no environment variables. The final API base is the assigned origin followed by `/api/v1`.

Validation completed locally: data build checks, 12 API tests, and HTTP checks for the documentation, static assets, OpenAPI specification, health endpoint, and first-seat results. The Vercel deployment itself is unverified. Browser visual checks could not run because the browser download was unavailable in this environment.

Before marketing complete official coverage, resolve the data-verification gate in API_PLAN.md and DATA_AUDIT.md. The current API clearly marks every row as provisional.
