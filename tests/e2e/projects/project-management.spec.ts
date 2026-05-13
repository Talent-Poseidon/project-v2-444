import { test, expect } from "@playwright/test";

test.describe("Admin can manage projects", () => {
  test.beforeEach(async ({ page }) => {
    const title = test.info().title;
    console.log(`[Test: ${title}] Navigating to /admin/projects...`);

    const response = await page.goto("/admin/projects");
    console.log(
      `[Test: ${title}] Status: ${response?.status()} | URL: ${page.url()}`
    );

    await expect(page).toHaveURL(/\/admin\/projects/);
    await expect(page.getByTestId("project-page-nav")).toBeVisible();
  });

  test("Admin views the project list with seeded data", async ({ page }) => {
    await expect(page.getByTestId("project-list-container")).toBeVisible();

    // Wait for async data to load
    const firstItem = page
      .locator('[data-testid^="project-item-"]')
      .first();
    await expect(firstItem).toBeVisible({ timeout: 10000 });

    const count = await page
      .locator('[data-testid^="project-item-"]')
      .count();
    console.log(`[Project List] Found ${count} projects`);
    expect(count).toBeGreaterThan(0);
  });

  test("Admin creates a new project", async ({ page }) => {
    const uniqueName = `E2E Project ${Date.now()}`;

    // Open create dialog
    await page.getByTestId("new-project-btn").click();

    // Fill form
    await page.getByTestId("project-name-input").fill(uniqueName);
    await page
      .getByTestId("project-description-input")
      .fill("Test project description");
    await page.getByTestId("batch-name-input").fill("Batch A");

    // Submit
    await page.getByTestId("submit-project-btn").click();

    // Assert success
    await expect(page.getByTestId("project-created-alert")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId("project-created-alert")).toContainText(
      "created successfully"
    );
    console.log(`[Project] Created: ${uniqueName}`);

    // Verify project appears in list
    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 10000 });
  });

  test("Admin sees validation error when project name is empty", async ({
    page,
  }) => {
    // Open create dialog
    await page.getByTestId("new-project-btn").click();

    // Submit without filling name
    await page.getByTestId("submit-project-btn").click();

    // Assert error
    await expect(page.getByTestId("project-error-alert")).toBeVisible();
    await expect(page.getByTestId("project-error-alert")).toContainText(
      "Project name is required"
    );
  });

  test("Admin navigates to project details", async ({ page }) => {
    // Wait for seeded project to load
    const viewBtn = page
      .locator('[data-testid^="view-project-"]')
      .first();
    await expect(viewBtn).toBeVisible({ timeout: 10000 });

    await viewBtn.click();

    // Should navigate to project detail page
    await expect(page).toHaveURL(/\/admin\/projects\/.+/);
    await expect(page.getByTestId("project-detail-container")).toBeVisible({
      timeout: 10000,
    });
    console.log("[Project] Navigated to project details");
  });
});

test.describe("Admin can manage project invitations", () => {
  test.beforeEach(async ({ page }) => {
    const title = test.info().title;
    console.log(
      `[Test: ${title}] Navigating to seed project detail...`
    );

    const response = await page.goto("/admin/projects/seed-project-1");
    console.log(
      `[Test: ${title}] Status: ${response?.status()} | URL: ${page.url()}`
    );

    await expect(page.getByTestId("project-detail-container")).toBeVisible({
      timeout: 10000,
    });
  });

  test("Admin sends invitations to participants", async ({ page }) => {
    // Verify participants are visible
    await expect(
      page.getByTestId("participant-item-seed-participant-1")
    ).toBeVisible({ timeout: 10000 });

    // Send invitations
    await page.getByTestId("send-invitations-btn").click();

    // Should see success message (invitations sent to participants without active invitation)
    await expect(page.getByTestId("project-success-alert")).toBeVisible({
      timeout: 10000,
    });
    console.log("[Invitations] Sent invitations");
  });

  test("Admin can see invitation statuses", async ({ page }) => {
    // Verify invitation status badges are visible
    await expect(
      page.getByTestId("invitation-status-seed-participant-1")
    ).toBeVisible({ timeout: 10000 });
    console.log("[Invitations] Invitation statuses are visible");
  });

  test("Admin can resend expired invitation", async ({ page }) => {
    // Check for expired invitation resend button
    const resendBtn = page.getByTestId(
      "resend-invitation-seed-participant-2-btn"
    );
    await expect(resendBtn).toBeVisible({ timeout: 10000 });

    await resendBtn.click();

    await expect(page.getByTestId("project-success-alert")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId("project-success-alert")).toContainText(
      "resent"
    );
    console.log("[Invitations] Resent expired invitation");
  });
});

test.describe("Admin can manage project assessors", () => {
  test.beforeEach(async ({ page }) => {
    const title = test.info().title;
    console.log(
      `[Test: ${title}] Navigating to seed project detail...`
    );

    const response = await page.goto("/admin/projects/seed-project-1");
    console.log(
      `[Test: ${title}] Status: ${response?.status()} | URL: ${page.url()}`
    );

    await expect(page.getByTestId("project-detail-container")).toBeVisible({
      timeout: 10000,
    });

    // Switch to assessors tab
    await page.getByTestId("assessors-tab").click();
  });

  test("Admin assigns an assessor from master data", async ({ page }) => {
    // Open assessor select
    await page.getByTestId("assessor-select").click();

    // Select first available assessor
    const firstOption = page.getByRole("option").first();
    await expect(firstOption).toBeVisible({ timeout: 5000 });
    await firstOption.click();

    // Click assign
    await page.getByTestId("assign-assessor-btn").click();

    // Assert success
    await expect(page.getByTestId("project-success-alert")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId("project-success-alert")).toContainText(
      "assigned successfully"
    );
    console.log("[Assessors] Assigned assessor from master data");
  });
});

test.describe("Admin can manage batch participants", () => {
  test.beforeEach(async ({ page }) => {
    const title = test.info().title;
    console.log(
      `[Test: ${title}] Navigating to seed project detail...`
    );

    const response = await page.goto("/admin/projects/seed-project-1");
    console.log(
      `[Test: ${title}] Status: ${response?.status()} | URL: ${page.url()}`
    );

    await expect(page.getByTestId("project-detail-container")).toBeVisible({
      timeout: 10000,
    });
  });

  test("Admin adds a participant to a batch", async ({ page }) => {
    const uniqueName = `Participant ${Date.now()}`;

    await page
      .getByTestId("participant-name-input")
      .fill(uniqueName);
    await page
      .getByTestId("participant-email-input")
      .fill(`test-${Date.now()}@example.com`);

    await page.getByTestId("add-participant-btn").click();

    await expect(page.getByTestId("project-success-alert")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId("project-success-alert")).toContainText(
      "Participant added"
    );
    console.log(`[Batch] Added participant: ${uniqueName}`);
  });
});
