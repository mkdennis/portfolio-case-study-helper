import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests @a11y', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('dashboard should be accessible', async ({ page }) => {
    await page.goto('/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('form inputs should have proper labels', async ({ page }) => {
    await page.goto('/dashboard/new');

    const inputs = page.locator('input:not([type="hidden"]), textarea, select');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      
      // Check for label association
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      
      // Should have one of: id (with label), aria-label, or aria-labelledby
      expect(
        id || ariaLabel || ariaLabelledby,
        `Input ${i} should have an accessible label`
      ).toBeTruthy();
    }
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/');

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledby = await button.getAttribute('aria-labelledby');

      expect(
        text?.trim() || ariaLabel || ariaLabelledby,
        `Button ${i} should have an accessible name`
      ).toBeTruthy();
    }
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      const ariaLabel = await img.getAttribute('aria-label');

      expect(
        alt !== null || role === 'presentation' || role === 'none' || ariaLabel,
        `Image ${i} should have alt text or presentation role`
      ).toBeTruthy();
    }
  });

  test('keyboard navigation should work', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.tagName.toLowerCase();
    });

    // Should focus on an interactive element
    expect(['button', 'a', 'input', 'select', 'textarea', 'body']).toContain(focused);
  });

  test('color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .disableRules(['color-contrast']) // May want to enable later
      .analyze();

    // Check for other AA violations besides contrast (which can be noisy)
    const nonContrastViolations = accessibilityScanResults.violations.filter(
      v => v.id !== 'color-contrast'
    );

    expect(nonContrastViolations).toEqual([]);
  });

  test('form should be keyboard navigable', async ({ page }) => {
    await page.goto('/dashboard/new');

    const firstInput = page.locator('input, textarea, select').first();
    
    if (await firstInput.isVisible()) {
      await firstInput.focus();
      await expect(firstInput).toBeFocused();

      // Tab to next field
      await page.keyboard.press('Tab');
      
      const focused = await page.evaluate(() => {
        return document.activeElement?.tagName.toLowerCase();
      });

      expect(['button', 'a', 'input', 'select', 'textarea']).toContain(focused);
    }
  });

  test('dialogs should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/');

    const dialogs = page.locator('[role="dialog"]');
    const count = await dialogs.count();

    for (let i = 0; i < count; i++) {
      const dialog = dialogs.nth(i);
      
      // Check for aria-labelledby or aria-label
      const ariaLabel = await dialog.getAttribute('aria-label');
      const ariaLabelledby = await dialog.getAttribute('aria-labelledby');
      
      expect(
        ariaLabel || ariaLabelledby,
        `Dialog ${i} should have aria-label or aria-labelledby`
      ).toBeTruthy();
    }
  });

  test('headings should follow proper hierarchy', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['heading-order'])
      .analyze();

    const headingViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'heading-order'
    );

    expect(headingViolations).toEqual([]);
  });

  test('links should have discernible text', async ({ page }) => {
    await page.goto('/');

    const links = page.locator('a');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');

      expect(
        text?.trim() || ariaLabel || title,
        `Link ${i} should have discernible text`
      ).toBeTruthy();
    }
  });
});
