# Contributing to Vehicle Inspection System

We welcome contributions to the Vehicle Inspection System! Please follow these guidelines to ensure a smooth and effective contribution process.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style Guide](#code-style-guide)
- [Git Workflow](#git-workflow)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/vehicle-inspection.git`
3. Add upstream remote: `git remote add upstream https://github.com/original-repo/vehicle-inspection.git`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites

- Node.js 18.17+ or 20.0+
- npm, yarn, or pnpm
- Supabase account
- Git

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in your Supabase credentials in .env.local
# NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Run development server
npm run dev
```

## Code Style Guide

[TODO: Define the code style guide here. Include information on TypeScript, React, Next.js best practices, naming conventions, formatting, and linting tools used (e.g., ESLint, Prettier).]

## Git Workflow

[TODO: Describe the Git workflow. For example:
- Fork the repository.
- Create a new branch for your feature or bugfix (e.g., `feat/new-feature` or `fix/bug-fix`).
- Commit your changes with clear and concise messages.
- Push your branch to your fork.
- Submit a pull request to the main repository.]

## Pull Request (PR) Template

[TODO: Define a PR template. This should include sections for:
- Description of changes
- Related issue(s)
- How to test
- Screenshots (if applicable)
- Checklist (e.g., tests added, documentation updated)]

## Review Process

[TODO: Outline the code review process. Include information on:
- Who reviews PRs
- Expected turnaround time
- How to address feedback
- Merging criteria]

## Testing Guidelines

### Unit Tests

```typescript
// vehicle-form.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { VehicleForm } from './vehicle-form'

describe('VehicleForm', () => {
  it('should validate required fields', async () => {
    // test implementation
  })
})
```

### Integration Tests

Test complete user flows and API interactions

### E2E Tests

For critical user paths (login, vehicle creation, etc.)

## Documentation

### Code Comments

- Add JSDoc comments for functions
- Explain complex logic inline
- Document component props

```typescript
/**
 * Creates a new vehicle in the system
 * @param vehicleData - The vehicle information to create
 * @returns The created vehicle with generated ID
 * @throws {ValidationError} If vehicle data is invalid
 */
export async function createVehicle(vehicleData: VehicleInput): Promise<Vehicle> {
  // implementation
}
```

### README Updates

Update README.md when:
- Adding new features
- Changing setup process
- Adding new dependencies
- Modifying environment variables

## Questions?

If you have questions:
1. Check existing issues and PRs
2. Ask in discussions
3. Create an issue for bugs/features

Thank you for contributing! 🚗✨ 