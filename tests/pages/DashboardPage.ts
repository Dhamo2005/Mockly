import { Page, expect, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly loginButton: Locator;
  readonly dashboardHeader: Locator;
  readonly noDataMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginButton = page.locator('button:has-text("Sign in to Sync")');
    this.dashboardHeader = page.locator('h2:has-text("Welcome Back!")');
    this.noDataMessage = page.locator('h2:has-text("No Data Found")');
  }

  async goto() {
    try {
      console.log('Navigating to the dashboard...');
      await this.page.goto('/');
    } catch (error) {
      console.error('Failed to navigate to dashboard:', error);
      throw error;
    }
  }

  async verifySignInPromptVisible() {
    try {
      console.log('Verifying sign-in prompt is visible...');
      await expect(this.loginButton).toBeVisible({ timeout: 5000 });
    } catch (error) {
      console.error('Sign-in prompt not visible:', error);
      throw error;
    }
  }
}
