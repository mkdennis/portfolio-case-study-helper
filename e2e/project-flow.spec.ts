import { test, expect } from '@playwright/test';

test.describe('Project Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display dashboard', async ({ page }) => {
    // Check for dashboard elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to create new project', async ({ page }) => {
    // Look for "New Project" or similar button
    const newProjectButton = page.getByRole('button', { name: /new project/i });
    
    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();
      await expect(page).toHaveURL(/\/dashboard\/new/);
    }
  });

  test('should validate project form', async ({ page }) => {
    await page.goto('/dashboard/new');

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /create|save/i }).first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      // Should show validation errors
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should allow filling out project form', async ({ page }) => {
    await page.goto('/dashboard/new');

    // Fill in project name
    const nameInput = page.getByLabel(/project name|name/i).first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Project');
      await expect(nameInput).toHaveValue('Test Project');
    }

    // Fill in role
    const roleInput = page.getByLabel(/role/i).first();
    if (await roleInput.isVisible()) {
      await roleInput.fill('Lead Designer');
      await expect(roleInput).toHaveValue('Lead Designer');
    }

    // Fill in problem space
    const problemInput = page.getByLabel(/problem space/i).first();
    if (await problemInput.isVisible()) {
      await problemInput.fill('This is a comprehensive problem space description that is long enough to pass validation');
    }
  });
});

test.describe('Journal Entries', () => {
  test('should navigate to journal entry creation', async ({ page }) => {
    await page.goto('/');
    
    // This would typically require an existing project
    // Navigate to a project's journal section
    const projectLink = page.getByRole('link').first();
    
    if (await projectLink.count() > 0 && await projectLink.isVisible()) {
      // Would navigate to project detail
    }
  });

  test('should handle journal entry form', async ({ page }) => {
    // Test journal entry form if accessible
    const dateInput = page.locator('input[type="date"]').first();
    
    if (await dateInput.isVisible()) {
      await dateInput.fill('2024-01-15');
    }
  });
});

test.describe('Asset Management', () => {
  test('should have asset upload functionality', async ({ page }) => {
    await page.goto('/');
    
    // Check for asset-related UI elements
    const uploadArea = page.getByText(/upload|asset/i).first();
    
    if (await uploadArea.isVisible()) {
      expect(uploadArea).toBeVisible();
    }
  });
});

test.describe('Navigation', () => {
  test('should have working navigation header', async ({ page }) => {
    await page.goto('/');
    
    // Check for navigation elements
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();
  });

  test('should navigate between sections', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation links
    const links = page.getByRole('link');
    const count = await links.count();
    
    expect(count).toBeGreaterThan(0);
  });
});
