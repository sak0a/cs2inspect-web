# GitHub Actions CI/CD Documentation

Complete guide for the automated CI/CD pipelines configured for CS2Inspect.

## Overview

The project uses GitHub Actions for automated testing, building, deployment, and Docker image publishing. There are 4 workflows:

1. **CI Pipeline** (`ci.yml`) - Tests, lints, and builds on every push/PR
2. **Build Docker Images** (`docker.yml`) - Builds and pushes Docker images to GHCR
3. **Create Release** (`release.yml`) - Creates a tagged release and triggers Docker builds
4. **Deploy Documentation** (`deploy-docs.yml`) - Builds and deploys VitePress docs to GitHub Pages

---

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers:**
- Push to `master` or `dev` branch
- Pull requests to `master` or `dev`
- Ignores: markdown files, `docs/`, `services/docs-site/`, workflow files (`docker.yml`, `release.yml`)

**Jobs:**

#### Test & Lint
- Runs type checking with TypeScript
- Lints code with ESLint
- Executes test suite with Bun (web app + steam-service)

#### Build Application
- Builds production bundle with `bun run build`
- Validates build success

**Badge:**
```markdown
![CI](https://github.com/sak0a/cs2inspect-web/workflows/CI/badge.svg)
```

---

### 2. Build Docker Images (`docker.yml`)

**Triggers:**
- Push to `master` or `dev` branch
- Tag push (`v*`)
- Manual trigger via `workflow_dispatch` (with optional platform selection)

**Images Built:**

| Image | Registry |
|-------|----------|
| Web App | `ghcr.io/sak0a/cs2inspect-web` |
| Steam Service | `ghcr.io/sak0a/cs2inspect-web-steam-service` |

**Tag Strategy:**

| Trigger | Tags Produced |
|---------|--------------|
| Push to `master` | `:latest`, `:master`, `:master-{sha}` |
| Push to `dev` | `:dev`, `:dev-{sha}` |
| Tag `v1.2.3` | `:v1.2.3`, `:1.2` |
| Manual dispatch | Based on selected ref |

**Features:**
- GitHub Actions build cache (`type=gha`) for fast rebuilds
- Docker Buildx for multi-platform support
- Automatic metadata extraction via `docker/metadata-action`

**Pull Images:**
```bash
# Latest from master
docker pull ghcr.io/sak0a/cs2inspect-web:latest
docker pull ghcr.io/sak0a/cs2inspect-web-steam-service:latest

# Specific version
docker pull ghcr.io/sak0a/cs2inspect-web:v1.2.3
docker pull ghcr.io/sak0a/cs2inspect-web-steam-service:v1.2.3

# Dev branch
docker pull ghcr.io/sak0a/cs2inspect-web:dev
```

---

### 3. Create Release (`release.yml`)

**Trigger:** Manual dispatch only (via GitHub Actions UI)

**Inputs:**

| Input | Description | Required |
|-------|-------------|----------|
| `version` | Release version, e.g. `1.2.3` (no `v` prefix) | Yes |
| `prerelease` | Mark as pre-release | No |
| `draft` | Create as draft | No |

**What it does:**

1. Validates version format (semver: `X.Y.Z` or `X.Y.Z-suffix`)
2. Checks out `master` branch
3. Verifies tag doesn't already exist
4. Generates changelog from commits since last tag
5. Creates annotated git tag `v{version}` and pushes it
6. Creates a GitHub Release with changelog and Docker pull instructions
7. Triggers the Docker build workflow via `gh workflow run docker.yml --ref "v{version}"`

::: tip Why `gh workflow run`?
Events created by `GITHUB_TOKEN` (like tag pushes) don't trigger other workflows. The release workflow works around this by using `gh workflow run` to explicitly dispatch the Docker build, which is exempt from this restriction.
:::

**Usage:**
1. Go to **Actions** tab in GitHub
2. Select **Create Release**
3. Click **Run workflow**
4. Enter version (e.g., `1.2.3`)
5. Click **Run workflow**

After the workflow completes, update your Coolify environment:
```bash
WEB_IMAGE_TAG=v1.2.3
SS_IMAGE_TAG=v1.2.3
```

---

### 4. Deploy Documentation (`deploy-docs.yml`)

**Triggers:**
- Push to `master` that changes: `services/docs-site/**`, `server/api/**`, `server/types/**`, `types/**`, `docs/**`
- Manual dispatch

**What it does:**
1. Installs docs-site dependencies
2. Auto-generates API documentation from source
3. Builds VitePress site
4. Deploys to GitHub Pages

**URL:** [https://sak0a.github.io/cs2inspect-web/](https://sak0a.github.io/cs2inspect-web/)

---

## Deployment Flow

### Push to Master (Automatic)

```
Push to master
    │
    ├──► CI Pipeline (ci.yml)
    │       Tests, Lint, Build
    │
    ├──► Build Docker Images (docker.yml)
    │       Builds :latest, :master, :master-{sha}
    │
    └──► Deploy Docs (deploy-docs.yml)
            Only if docs/types changed
```

### Push to Dev (Automatic)

```
Push to dev
    │
    ├──► CI Pipeline (ci.yml)
    │       Tests, Lint, Build
    │
    └──► Build Docker Images (docker.yml)
            Builds :dev, :dev-{sha}
```

### Creating a Release (Manual)

```
Manual: Create Release
    │
    ├──► Validate version
    ├──► Create tag v1.2.3
    ├──► Create GitHub Release
    └──► Trigger Docker Build
            Builds :v1.2.3, :1.2
```

---

## Configuration

### Environment Variables

Set in **Settings -> Secrets and variables -> Actions**:

```bash
# GitHub Token (automatic — no setup needed)
GITHUB_TOKEN=ghp_xxx
```

No additional secrets are required for CI/CD. The `GITHUB_TOKEN` is automatically provided by GitHub Actions and has the necessary permissions for:
- Pushing Docker images to GHCR
- Creating tags and releases
- Triggering workflows
- Deploying to GitHub Pages

### Workflow Permissions

Required permissions in **Settings -> Actions -> General**:

- Read and write permissions
- Allow GitHub Actions to create pull requests

---

## Troubleshooting

### CI Pipeline Fails

**Solutions:**
1. Run locally: `bun run typecheck && bun run lint && bun test`
2. Check workflow logs in Actions tab
3. Fix errors and push again

### Docker Build Fails

**Solutions:**
1. Check Dockerfile syntax
2. Verify build context paths
3. Check GHCR authentication (packages must be accessible)
4. Review build cache — try clearing with a manual dispatch

### Release Doesn't Trigger Docker Build

The release workflow uses `gh workflow run docker.yml` to trigger builds. If this fails:
1. Check that `actions: write` permission is set in the release workflow
2. Manually trigger "Build Docker Images" from the Actions tab, selecting the `v*` tag as the ref

### "manifest unknown" Error in Coolify

This means the Docker image tag doesn't exist in GHCR:
1. Go to GitHub -> Actions -> "Build Docker Images" and verify a run completed for that tag
2. Check the workflow run summary for the actual tags that were pushed
3. Manually trigger a docker build from the Actions tab

---

## Monitoring

### View Workflow Status

1. Go to **Actions** tab
2. View all workflow runs
3. Click a run for detailed logs

### Workflow Badges

Add to README.md:

```markdown
![CI](https://github.com/sak0a/cs2inspect-web/workflows/CI/badge.svg)
![Docker](https://github.com/sak0a/cs2inspect-web/workflows/Build%20Docker%20Images/badge.svg)
```

---

## Best Practices

### Commit Messages

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update deployment guide"
```

### Branch Strategy

```
master (production)
  ├── dev (development/staging)
  ├── feature/xyz (feature branches)
  └── fix/abc (bug fixes)
```

- **master**: Production branch. Pushes build `:latest` Docker images.
- **dev**: Development branch. Pushes build `:dev` Docker images.
- **feature/fix branches**: Merge into `dev` or `master` via PR.

### Version Tags

Use the **Create Release** workflow instead of manually creating tags. It handles tag creation, changelog generation, and Docker image builds in one step.

---

## Quick Start

### First Setup

1. Push workflow files to repository
2. Workflows activate automatically
3. Verify in **Actions** tab

### First Release

1. Push code to `master` — CI runs tests, Docker builds `:latest`
2. When ready for a versioned release: **Actions -> Create Release -> Enter version -> Run**
3. Update Coolify env vars with the new version tag
4. Redeploy in Coolify

---

## Additional Resources

- [Workflow Syntax](https://docs.github.com/actions/reference/workflow-syntax-for-github-actions)
- [Docker Build Action](https://github.com/docker/build-push-action)
- [Docker Metadata Action](https://github.com/docker/metadata-action)
- [Setup Bun](https://github.com/oven-sh/setup-bun)
