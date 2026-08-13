import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';

test.describe('Dashboard Tests', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
  });

  test('User should see sign-in prompt when not authenticated', async ({ page }) => {
    try {
      console.log('Starting test: User should see sign-in prompt when not authenticated');
      
      // 1. Navigate to the page
      await dashboardPage.goto();

      // 2. Verify sign-in prompt is visible
      await dashboardPage.verifySignInPromptVisible();

      console.log('Test completed successfully.');
    } catch (error) {
      console.error('Test failed:', error);
      throw error; // Rethrow to ensure test fails in the runner
    }
  });
});
