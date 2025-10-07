# Visual Testing with Chromatic

This guide explains how to use Chromatic for visual testing in the Vehicle Inspection application.

## Overview

Chromatic is a visual testing platform that automatically captures screenshots of your components and compares them across commits to detect unintended visual changes.

## Setup

### 1. Prerequisites

- Storybook is already configured
- Chromatic CLI is installed
- Project token is configured

### 2. Environment Variables

Add your Chromatic project token to GitHub Secrets:

```bash
# Get your project token from https://www.chromatic.com/
CHROMATIC_PROJECT_TOKEN=your-project-token-here
```

## Usage

### Running Visual Tests Locally

```bash
# Run Chromatic tests
npm run chromatic

# Run only for changed files
npm run chromatic:test

# Auto-accept changes (use with caution)
npm run chromatic:ci
```

### Running Storybook

```bash
# Start Storybook development server
npm run storybook

# Build Storybook for production
npm run build-storybook
```

## Configuration

### Chromatic Config (`chromatic.config.json`)

```json
{
  "projectId": "Project:68da33ca2d5b652e029c5842",
  "onlyChanged": true,
  "zip": true,
  "buildScriptName": "build-storybook",
  "storybookBuildDir": "storybook-static",
  "exitZeroOnChanges": true,
  "autoAcceptChanges": false,
  "ignoreLastBuildOnBranch": "main",
  "skip": false,
  "debug": false,
  "traceChanges": true,
  "appCode": "vehicle-inspection",
  "branchName": "main",
  "ci": false
}
```

### Storybook Configuration

The `.storybook/preview.ts` file includes Chromatic-specific parameters:

- **Viewports**: Tests components at different screen sizes (320px, 768px, 1024px, 1280px)
- **Delay**: 1-second delay before capturing screenshots
- **Animation Control**: Pauses animations for consistent captures

## Visual Testing Stories

### Key Components Tested

1. **Vehicle Inspection Form** (`stories/VehicleInspection.stories.tsx`)
   - Default state
   - With pre-selected vehicle
   - Editing existing inspection
   - Resuming inspection
   - With booking context

2. **Quotation Details** (`stories/QuotationDetails.stories.tsx`)
   - Different quotation statuses
   - Member vs non-member views
   - Various workflow states

3. **Data Table** (`stories/DataTable.stories.tsx`)
   - Default state
   - With search functionality
   - Empty state
   - Large datasets

4. **UI Components** (`components/ui/*.stories.tsx`)
   - All Shadcn UI components
   - Different states and variants
   - Accessibility testing

## Best Practices

### 1. Story Organization

- Group related stories in folders
- Use descriptive story names
- Include multiple states for each component
- Test edge cases and error states

### 2. Visual Testing Guidelines

- Keep stories focused on visual aspects
- Use mock data that represents real scenarios
- Test responsive behavior
- Include accessibility considerations

### 3. CI/CD Integration

- Visual tests run automatically on PRs
- Changes are auto-accepted on main branch
- Failed tests block PR merges
- Review changes in Chromatic dashboard

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Storybook build: `npm run build-storybook`
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Visual Differences**
   - Review changes in Chromatic dashboard
   - Check if changes are intentional
   - Update baseline if needed

3. **Missing Stories**
   - Ensure stories are in the correct directory
   - Check Storybook configuration
   - Verify story exports

### Debug Commands

```bash
# Debug Chromatic configuration
npx chromatic --debug

# Test specific stories
npx chromatic --only-changed --debug

# Check Storybook build
npm run build-storybook && ls -la storybook-static
```

## Workflow

### 1. Development

1. Create or modify components
2. Update corresponding stories
3. Test locally with Storybook
4. Run Chromatic tests locally

### 2. Pull Request

1. Push changes to feature branch
2. GitHub Actions runs Chromatic tests
3. Review visual changes in Chromatic dashboard
4. Approve or request changes

### 3. Main Branch

1. Merge approved PR
2. Chromatic auto-accepts changes
3. Update baseline for future comparisons

## Advanced Features

### Custom Viewports

Add custom viewports in `.storybook/preview.ts`:

```typescript
chromatic: {
  viewports: [320, 768, 1024, 1280, 1920],
  modes: {
    'mobile': { viewport: 'mobile1' },
    'tablet': { viewport: 'tablet' },
    'desktop': { viewport: 'desktop' },
    'wide': { viewport: 'wide' },
  },
}
```

### Conditional Testing

Skip tests for certain conditions:

```typescript
export const ConditionalStory: Story = {
  parameters: {
    chromatic: { disable: true }, // Skip this story
  },
};
```

### Custom Delays

Add delays for async components:

```typescript
export const AsyncStory: Story = {
  parameters: {
    chromatic: { delay: 2000 }, // Wait 2 seconds
  },
};
```

## Monitoring

### Chromatic Dashboard

- View all visual changes
- Compare before/after screenshots
- Manage baselines
- Configure notifications

### GitHub Integration

- PR status checks
- Comment with visual changes
- Block merges on failures
- Auto-approve on main branch

## Resources

- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Storybook Documentation](https://storybook.js.org/docs/)
- [Visual Testing Best Practices](https://www.chromatic.com/docs/visual-testing)
