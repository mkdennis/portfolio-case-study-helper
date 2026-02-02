# Testing Documentation - Portfolio Case Study Helper

## Overview

Comprehensive testing strategy for the Portfolio Case Study Helper Next.js application, covering unit tests, integration tests, end-to-end (E2E) tests, and accessibility tests.

### Testing Stack
- **Vitest** - Unit and integration testing (optimized for Next.js)
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **@axe-core/playwright** - Accessibility testing
- **Zod** - Schema validation testing

## Running Tests Locally

### Unit and Integration Tests
```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### End-to-End Tests
```bash
# Install Playwright browsers (first time only)
npm run playwright:install

# Build Next.js app first
npm run build

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Accessibility Tests
```bash
# Run accessibility tests only
npm run test:a11y
```

## Test File Organization

```
portfolio-case-study-helper/
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── button.test.tsx          # UI component tests
│       ├── input.tsx
│       └── input.test.tsx
├── lib/
│   ├── utils.ts
│   ├── utils.test.ts                # Utility function tests
│   └── schemas/
│       ├── project.ts
│       └── project.test.ts          # Schema validation tests
├── src/
│   └── test/
│       └── setup.ts                 # Test configuration
├── e2e/
│   ├── project-flow.spec.ts        # E2E user flow tests
│   └── accessibility.spec.ts       # Accessibility tests
├── vitest.config.ts                 # Vitest configuration
└── playwright.config.ts             # Playwright configuration
```

## What Each Test Suite Covers

### Unit Tests (Vitest + RTL)

**UI Components (`components/ui/*`):**
- `Button` - All variants (default, destructive, outline, ghost, link)
- `Button` - All sizes (default, sm, lg, icon variants)
- `Button` - Disabled state, custom className, asChild prop
- `Input` - Text input, placeholder, onChange events
- `Input` - Different input types (email, password, etc.)
- `Input` - Disabled state, aria-invalid, custom className

**Utilities (`lib/utils.ts`):**
- `cn()` - className merging utility
- Tailwind class conflict resolution
- Conditional class handling
- Array and complex input handling

**Schema Validation (`lib/schemas/project.ts`):**
- `createProjectSchema` - Project creation validation
- Required fields: name, role, startDate, problemSpace
- Optional fields: endDate, team, timeline, scope, technical, tags
- Status enum validation (in-progress, completed, paused)
- `journalEntrySchema` - Journal entry validation
- `assetMetadataSchema` - Asset metadata validation
- Role enum validation for assets

**Coverage goals:**
- Core UI components: 80%+ coverage
- Utilities: 90%+ coverage
- Schema validation: 95%+ coverage

### Integration Tests
Co-located with unit tests but focus on:
- Form submission workflows
- Data persistence with Dexie (IndexedDB)
- GitHub API integration
- Offline sync queue
- Conflict resolution

### E2E Tests (Playwright)

**Critical user flows:**

1. **Project Management Flow**
   - Dashboard display
   - Navigate to create new project
   - Project form validation
   - Fill out complete project form
   - Save and view project

2. **Journal Entries**
   - Navigate to journal entry creation
   - Fill out journal entry form
   - Save journal entry
   - View journal entries timeline

3. **Asset Management**
   - Upload assets
   - Tag and categorize assets
   - Link assets to journal entries
   - View asset gallery

4. **Navigation**
   - Header navigation
   - Navigate between projects
   - Navigate to different sections

### Accessibility Tests
Located in `e2e/accessibility.spec.ts`, tagged with `@a11y`.

**What we test:**
- ✅ No automatic accessibility violations (axe-core)
- ✅ All form inputs have proper labels
- ✅ All buttons have accessible names
- ✅ All images have alt text
- ✅ Keyboard navigation works throughout the app
- ✅ Color contrast meets WCAG 2.0 AA standards
- ✅ Forms are keyboard accessible
- ✅ Dialogs have proper ARIA attributes
- ✅ Headings follow proper hierarchy
- ✅ Links have discernible text

## How to Add New Tests

### Adding a Unit Test

```typescript
// components/ui/my-component.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './my-component';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Adding a Schema Test

```typescript
// lib/schemas/my-schema.test.ts
import { describe, it, expect } from 'vitest';
import { mySchema } from './my-schema';

describe('mySchema', () => {
  it('validates correct data', () => {
    const result = mySchema.safeParse({ field: 'value' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid data', () => {
    const result = mySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
```

### Adding an E2E Test

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('completes user flow', async ({ page }) => {
    await page.goto('/my-feature');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

## CI/CD Pipeline

Runs automatically on push to `main` and pull requests.

### Pipeline Stages

1. **Unit & Integration Tests**
   - Runs all Vitest tests
   - Generates coverage report
   - Uploads coverage artifacts

2. **E2E Tests**
   - Builds Next.js app
   - Installs Playwright browsers
   - Runs E2E tests in headless mode
   - Uploads test report

3. **Accessibility Tests**
   - Builds Next.js app
   - Runs accessibility-specific tests
   - Fails if violations found
   - Uploads accessibility report

## Coverage Goals and Current Status

Run `npm run test:coverage` to see current coverage.

### Goals
- **Overall**: 75%+ coverage
- **UI Components**: 80%+ coverage
- **Utilities & Schemas**: 90%+ coverage
- **Business Logic**: 85%+ coverage

### Critical Paths
- Project creation and validation
- Journal entry management
- Asset upload and management
- Schema validation
- Offline sync queue
- Conflict resolution

## Special Testing Considerations

### Next.js Specific
- API routes should be tested separately
- Server components may require special setup
- Use `next/navigation` mocks for router testing

### IndexedDB (Dexie)
- Use fake-indexeddb for unit tests
- Test offline functionality
- Test sync queue behavior

### GitHub Integration
- Mock GitHub API calls in unit tests
- Use test repositories for E2E tests
- Test OAuth flow separately

## Best Practices

1. **Write tests alongside features** - Don't defer testing
2. **Test user behavior** - Focus on what users do, not implementation details
3. **Keep tests isolated** - Each test should be independent
4. **Use descriptive names** - Test names should explain what they verify
5. **Mock external services** - Keep tests fast and reliable
6. **Test error states** - Don't just test happy paths
7. **Maintain test quality** - Refactor tests as you refactor code

## Troubleshooting

### Next.js Build Errors
- Clear `.next/` directory: `rm -rf .next/`
- Rebuild: `npm run build`

### Vitest Cache Issues
- Clear cache: `npx vitest clear`

### Playwright Timeouts
- Increase timeout in `playwright.config.ts`
- Check if dev server is running properly
- Use `--debug` flag for troubleshooting

### IndexedDB Tests Failing
- Ensure fake-indexeddb is properly configured in setup
- Clear IndexedDB between tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Zod Documentation](https://zod.dev/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
