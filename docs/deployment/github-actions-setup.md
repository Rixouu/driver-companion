# 🚀 GitHub Actions Workflow Setup

This document outlines the comprehensive GitHub Actions workflow setup for the Vehicle Inspection System, providing automated CI/CD, security scanning, code quality checks, and maintenance tasks.

## 📋 Overview

The GitHub Actions setup includes multiple workflows that run automatically based on different triggers:

- **CI Pipeline** - Main continuous integration workflow
- **Code Quality** - Code quality and formatting checks
- **Security Scan** - Security vulnerability scanning
- **Performance Testing** - Performance and Lighthouse testing
- **Dependency Updates** - Automated dependency management
- **Cleanup** - Maintenance and cleanup tasks
- **Chromatic** - Visual regression testing
- **Status** - Workflow status monitoring

## 🔧 Workflow Details

### 1. CI Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` and `develop` branches
- Pull requests to `main` and `develop` branches
- Daily security audit at 2 AM UTC

**Jobs:**
- **Security Audit** - npm audit and Snyk security scanning
- **Test** - TypeScript checking, linting, unit tests, and E2E tests
- **Build** - Application build verification
- **Deploy Staging** - Automatic deployment to staging on `develop` branch
- **Deploy Production** - Automatic deployment to production on `main` branch

**Features:**
- Multi-Node.js version testing (18.x, 20.x, 22.x)
- Coverage reporting with Codecov integration
- Playwright E2E testing
- TypeScript type checking
- Automated deployments with environment protection

### 2. Code Quality (`code-quality.yml`)

**Triggers:**
- Push to `main` and `develop` branches
- Pull requests to `main` and `develop` branches
- Manual dispatch

**Checks:**
- ESLint code linting
- Prettier formatting validation
- TypeScript type checking
- Console.log statement detection
- TODO/FIXME comment tracking

### 3. Security Scan (`security-scan.yml`)

**Triggers:**
- Daily at 3 AM UTC
- Push to `main` and `develop` branches
- Pull requests to `main` and `develop` branches
- Manual dispatch

**Features:**
- npm audit with moderate severity threshold
- Snyk security scanning
- GitHub Code Scanning integration
- PR comment with security results
- SARIF file upload for security findings

### 4. Performance Testing (`performance-test.yml`)

**Triggers:**
- Weekly on Sundays at 2 AM UTC
- Push to `main` branch
- Pull requests to `main` branch
- Manual dispatch

**Tests:**
- Lighthouse CI performance testing
- Playwright performance tests
- Core Web Vitals monitoring
- Accessibility, SEO, and best practices checks

### 5. Dependency Updates (`dependency-updates.yml`)

**Triggers:**
- Weekly on Mondays at 9 AM UTC
- Manual dispatch

**Features:**
- Automated dependency checking with `npm-check-updates`
- Automatic PR creation for updates
- Test execution after updates
- Build verification

### 6. Cleanup (`cleanup.yml`)

**Triggers:**
- Daily at 1 AM UTC
- Manual dispatch

**Tasks:**
- Delete old workflow runs (30+ days)
- Clean up old artifacts (7+ days)
- Repository maintenance

### 7. Chromatic Visual Testing (`chromatic.yml`)

**Triggers:**
- Push to `main` and `develop` branches
- Pull requests to `main` and `develop` branches

**Features:**
- Storybook visual regression testing
- Chromatic integration
- Auto-accept changes on main branch
- Only test changed files

## 🔐 Required Secrets

To fully utilize the GitHub Actions workflows, you need to configure the following secrets in your repository settings:

### Required Secrets:
- `SNYK_TOKEN` - Snyk security scanning token
- `CODECOV_TOKEN` - Codecov coverage reporting token
- `CHROMATIC_PROJECT_TOKEN` - Chromatic visual testing token

### Optional Secrets:
- `GITHUB_TOKEN` - Automatically provided by GitHub
- Environment-specific deployment tokens (if using custom deployment)

## 🚀 Setup Instructions

### 1. Enable GitHub Actions
GitHub Actions are automatically enabled for public repositories. For private repositories, ensure Actions are enabled in repository settings.

### 2. Configure Secrets
1. Go to your repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add the required secrets listed above

### 3. Set up Environments (Optional)
For deployment workflows, create environments in GitHub:
1. Go to repository settings
2. Navigate to "Environments"
3. Create `staging` and `production` environments
4. Configure environment protection rules as needed

### 4. Configure Branch Protection
Set up branch protection rules for `main` and `develop` branches:
1. Go to repository settings → "Branches"
2. Add rule for `main` branch
3. Enable "Require status checks to pass before merging"
4. Select required workflows

## 📊 Monitoring and Notifications

### Workflow Status
- All workflows include status reporting
- Failed workflows will show in the Actions tab
- PR status checks prevent merging on failures

### Notifications
- Email notifications for workflow failures (if configured)
- PR comments for security scan results
- Status summaries in workflow runs

### Artifacts
- Test coverage reports
- Performance test results
- Security scan results
- Build artifacts

## 🔧 Customization

### Adding New Workflows
1. Create a new `.yml` file in `.github/workflows/`
2. Follow the existing patterns for triggers and jobs
3. Test the workflow with manual dispatch

### Modifying Existing Workflows
1. Edit the appropriate `.yml` file
2. Test changes with a pull request
3. Monitor workflow runs for issues

### Environment Variables
Add environment-specific variables in workflow files:
```yaml
env:
  NODE_ENV: production
  CUSTOM_VAR: ${{ secrets.CUSTOM_SECRET }}
```

## 🐛 Troubleshooting

### Common Issues

1. **Workflow fails on dependency installation**
   - Check Node.js version compatibility
   - Verify package-lock.json is committed
   - Clear npm cache if needed

2. **Security scan failures**
   - Update Snyk token if expired
   - Check for high-severity vulnerabilities
   - Review security scan logs

3. **Deployment failures**
   - Verify environment secrets
   - Check deployment permissions
   - Review deployment logs

4. **Performance test failures**
   - Check Lighthouse configuration
   - Verify application is running
   - Review performance thresholds

### Debugging
- Check workflow logs in the Actions tab
- Use `workflow_dispatch` for manual testing
- Enable debug logging with `ACTIONS_STEP_DEBUG: true`

## 📈 Best Practices

1. **Keep workflows fast** - Use caching and parallel jobs
2. **Fail fast** - Run quick checks first (linting, type checking)
3. **Use matrix strategies** - Test on multiple Node.js versions
4. **Monitor resource usage** - Optimize workflow efficiency
5. **Regular maintenance** - Update actions and dependencies
6. **Security first** - Always run security scans
7. **Document changes** - Update this documentation when modifying workflows

## 🔄 Maintenance

### Regular Tasks
- Review and update GitHub Actions versions
- Monitor workflow performance
- Update security scan configurations
- Clean up old artifacts and runs

### Monthly Reviews
- Check workflow success rates
- Review security scan results
- Update dependency update schedules
- Optimize workflow performance

---

For questions or issues with the GitHub Actions setup, please refer to the [GitHub Actions documentation](https://docs.github.com/en/actions) or create an issue in the repository.
