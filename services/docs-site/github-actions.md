# GitHub Actions CI/CD Documentation

Complete guide for the automated CI/CD pipelines configured for CS2Inspect.

## 📋 Overview

The project uses GitHub Actions for automated testing, building, and deployment. There are 4 main workflows:

1. **CI Pipeline** - Tests and builds on every push/PR
2. **Auto Deploy** - Automatically deploys master to app branch
3. **Deploy to App Branch** - Builds and packages the app branch
4. **Docker Image Builder** - Builds and publishes Docker images

---

## 🔄 Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers:**
- Push to `master` branch
- Pull requests to `master`

**Jobs:**

#### Test & Lint
- Runs type checking with TypeScript
- Lints code with ESLint
- Executes test suite with Bun

#### Build Application
- Builds production bundle
- Uploads build artifact (7 days retention)
- Validates build success

#### Docker Build
- Builds Docker image (master only)
- Tests image functionality
- Uses build cache for speed

**Badge:**
```markdown
![CI Pipeline](https://github.com/sak0a/cs2inspect-web/workflows/CI%2FCD%20Pipeline/badge.svg)
```

---

### 2. Auto Deploy (`auto-deploy.yml`)

**Triggers:**
- Push to `master` branch
- Manual trigger via workflow_dispatch

**Purpose:**
Automatically runs the `deploy-app.sh` script to sync master to the app branch, excluding unnecessary services.

**Jobs:**

#### Deploy to App Branch
1. Checks out repository
2. Configures Git with bot credentials
3. Runs `scripts/deploy-app.sh`
4. Pushes changes to app branch

#### Trigger Build
- Waits for app branch workflow to start
- Provides status summary

**Excluded Directories:**
- `services/sticker-scraper`
- `services/charm-scraper`
- `services/steam-service`
- `services/docs-site`
- `public/img/*`

---

### 3. Deploy to App Branch (`deploy-app.yml`)

**Triggers:**
- Push to `app` branch (triggered by auto-deploy)
- Manual trigger

**Jobs:**

#### Build and Deploy
1. Checks out app branch
2. Installs Bun and dependencies
3. Runs type check, lint, tests (continue on error)
4. Builds production bundle
5. Creates deployment artifact (30 days retention)
6. Generates deployment summary

#### Notify
- Reports deployment success/failure
- Can be extended to send Slack/Discord notifications

**Artifact Contents:**
- `.output/` - Built application
- `package.json` - Dependencies manifest
- `bun.lockb` - Lock file
- `nuxt.config.ts` - Configuration
- `server/` - Server code
- `public/` - Static assets
- `locales/` - Translations

---

### 4. Docker Image Builder (`docker.yml`)

**Triggers:**
- Push to `master` or `app` branches
- Version tags (`v*`)
- Pull requests
- Manual trigger

**Features:**
- Multi-platform builds (amd64, arm64)
- Publishes to GitHub Container Registry
- Semantic versioning from tags
- Build caching for performance

**Image Tags:**
- `latest` - Latest master build
- `app` - Latest app branch build
- `v1.2.3` - Version tags
- `master-abc123` - Branch + commit SHA
- `pr-123` - Pull request builds

**Registry:**
```
ghcr.io/sak0a/cs2inspect-web
```

**Pull Image:**
```bash
docker pull ghcr.io/sak0a/cs2inspect-web:latest
```

---

## 🚀 Deployment Flow

### Automatic Deployment

```
┌─────────────────┐
│  Push to Master │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   CI Pipeline   │  ← Tests, Lint, Build
│   (ci.yml)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Auto Deploy    │  ← Runs deploy-app.sh
│ (auto-deploy)   │     Syncs to app branch
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Push to App    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy App      │  ← Build, Package
│ (deploy-app)    │     Create artifact
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Docker Build   │  ← Build & Push Image
│  (docker.yml)   │     to ghcr.io
└─────────────────┘
```

### Manual Deployment

Trigger workflows manually via GitHub UI:
1. Go to **Actions** tab
2. Select workflow
3. Click **Run workflow**
4. Choose branch and parameters

---

## 📦 Artifacts

### Build Artifacts

**Name Format:** `cs2inspect-app-{SHA}`  
**Retention:** 30 days  
**Size:** ~50-100MB (compressed)

**Contents:**
```
cs2inspect-build.tar.gz
├── .output/           # Built Nuxt app
├── package.json       # Dependencies
├── bun.lockb         # Lock file
├── nuxt.config.ts    # Config
├── server/           # Server code
├── public/           # Static files
├── locales/          # i18n
└── README.md         # Documentation
```

**Download:**
1. Go to workflow run
2. Scroll to **Artifacts** section
3. Click to download

**Extract & Deploy:**
```bash
# Extract
tar -xzf cs2inspect-build.tar.gz

# Install dependencies (if needed)
bun install --production

# Run migrations
bun run db:push

# Start application
bun run .output/server/index.mjs
```

---

## 🔧 Configuration

### Environment Variables

Set in **Settings → Secrets and variables → Actions**:

```bash
# GitHub Token (automatic)
GITHUB_TOKEN=ghp_xxx

# Optional: Custom secrets
STEAM_API_KEY=xxx
DATABASE_PASSWORD=xxx
JWT_TOKEN=xxx
```

### Workflow Permissions

Required permissions in **Settings → Actions → General**:

- ✅ Read and write permissions
- ✅ Allow GitHub Actions to create pull requests

### Branch Protection

Recommended rules for `master`:

- ✅ Require status checks (CI Pipeline)
- ✅ Require branches to be up to date
- ✅ Require review from code owners (optional)

---

## 🛠️ Customization

### Add Deployment Target

Edit `.github/workflows/deploy-app.yml`:

```yaml
- name: Deploy to VPS
  run: |
    rsync -avz cs2inspect-build.tar.gz user@server:/opt/cs2inspect/
    ssh user@server "cd /opt/cs2inspect && ./deploy.sh"
  env:
    SSH_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
```

### Add Slack Notifications

Add to any workflow:

```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Deployment ${{ job.status }}: ${{ github.sha }}"
      }
```

### Add Database Migrations

Add to `deploy-app.yml` after build:

```yaml
- name: Run migrations
  run: bun run db:push
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## 🐛 Troubleshooting

### CI Pipeline Fails

**Issue:** Tests or linting fail

**Solutions:**
1. Run locally: `bun test && bun run lint`
2. Fix errors and commit
3. Check workflow logs in Actions tab

### Deploy Script Fails

**Issue:** `deploy-app.sh` errors

**Solutions:**
1. Verify branch names in script
2. Check Git permissions
3. Ensure GITHUB_TOKEN has write access

### Docker Build Fails

**Issue:** Out of memory or timeout

**Solutions:**
1. Reduce layer complexity
2. Use smaller base images
3. Optimize build steps

### Artifact Not Created

**Issue:** Build artifact missing

**Solutions:**
1. Check build succeeded
2. Verify paths in workflow
3. Check artifact retention settings

---

## 📊 Monitoring

### View Workflow Status

**GitHub UI:**
1. Go to **Actions** tab
2. View all workflow runs
3. Click run for detailed logs

**API:**
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/sak0a/cs2inspect-web/actions/runs
```

### Workflow Badges

Add to README.md:

```markdown
![CI](https://github.com/sak0a/cs2inspect-web/workflows/CI%2FCD%20Pipeline/badge.svg)
![Docker](https://github.com/sak0a/cs2inspect-web/workflows/Build%20Docker%20Images/badge.svg)
```

### Success Rate

Track in **Insights → Actions** tab:
- Workflow run history
- Success/failure rates
- Average duration
- Most common failures

---

## 🔐 Security

### Secrets Management

**Best Practices:**
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate secrets regularly
- ✅ Limit secret scope (repository vs organization)
- ❌ Never log secrets
- ❌ Never commit secrets to repository

**Add Secret:**
1. Settings → Secrets and variables → Actions
2. Click **New repository secret**
3. Name and value
4. Save

### Audit Log

View in **Settings → Security → Audit log**:
- Workflow runs
- Secret access
- Permission changes

---

## 📈 Optimization

### Cache Dependencies

Already implemented:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.bun/install/cache
    key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
```

**Benefits:**
- 50-70% faster installs
- Reduced network usage
- Lower GitHub Action minutes

### Parallel Jobs

Jobs run in parallel by default. To add dependencies:

```yaml
job2:
  needs: job1  # Wait for job1
```

### Conditional Execution

Skip jobs based on conditions:

```yaml
if: github.ref == 'refs/heads/master'
```

---

## 🎯 Best Practices

### Commit Messages

For better deployment tracking:

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "deploy: release v1.2.3"
```

### Branch Strategy

```
master (main branch)
  ↓
  ├─ feature/xyz (feature branches)
  ├─ fix/abc (bug fixes)
  └─ app (deployment branch)
```

### Version Tags

Create releases:

```bash
git tag -a v1.2.3 -m "Release 1.2.3"
git push origin v1.2.3
```

Triggers Docker image with version tag.

---

## 📚 Additional Resources

### GitHub Actions Docs
- [Workflow Syntax](https://docs.github.com/actions/reference/workflow-syntax-for-github-actions)
- [Contexts](https://docs.github.com/actions/reference/context-and-expression-syntax-for-github-actions)
- [Secrets](https://docs.github.com/actions/security-guides/encrypted-secrets)

### Marketplace Actions
- [Checkout](https://github.com/actions/checkout)
- [Setup Bun](https://github.com/oven-sh/setup-bun)
- [Docker Build](https://github.com/docker/build-push-action)
- [Upload Artifact](https://github.com/actions/upload-artifact)

---

## 🎉 Quick Start

### Enable Workflows

1. Commit workflow files to repository
2. Push to GitHub
3. Workflows activate automatically

### First Deployment

```bash
# Make changes
git add .
git commit -m "feat: initial deployment"
git push origin master

# Workflows trigger automatically:
# 1. CI Pipeline runs tests
# 2. Auto Deploy syncs to app branch
# 3. Deploy App creates artifact
# 4. Docker builds image
```

### Monitor

1. Go to **Actions** tab
2. Watch workflows execute
3. Download artifacts if needed
4. Check Docker registry for images

---

## 📝 Summary

The GitHub Actions setup provides:

✅ **Automated Testing** - Every push runs tests  
✅ **Automated Deployment** - Master → App branch sync  
✅ **Build Artifacts** - Ready-to-deploy packages  
✅ **Docker Images** - Multi-platform container images  
✅ **Status Monitoring** - Real-time workflow status  
✅ **Version Management** - Semantic versioning support  

Zero manual intervention needed for deployments! 🚀
