import { test, expect } from "@playwright/test";

test.describe("Batch size validation", () => {
  test("API rejects adding more than 20 participants to a batch", async ({
    request,
  }) => {
    const title = test.info().title;
    console.log(`[Test: ${title}] Testing batch size limit via API...`);

    // First, create a project with a batch
    const projectRes = await request.post("/api/projects", {
      data: {
        name: `Batch Limit Test ${Date.now()}`,
        description: "Testing batch participant limit",
        batchName: "Test Batch",
      },
    });
    expect(projectRes.ok()).toBeTruthy();
    const project = await projectRes.json();
    const batchId = project.batches[0].id;
    const projectId = project.id;

    console.log(`[Batch Validation] Created project: ${projectId}`);
    console.log(`[Batch Validation] Created batch: ${batchId}`);

    // Add 20 participants (should all succeed)
    for (let i = 1; i <= 20; i++) {
      const res = await request.post(
        `/api/projects/${projectId}/batches/${batchId}/participants`,
        {
          data: {
            name: `Participant ${i}`,
            email: `p${i}-${Date.now()}@example.com`,
          },
        }
      );
      expect(res.ok()).toBeTruthy();
    }
    console.log(`[Batch Validation] Added 20 participants successfully`);

    // Try adding the 21st participant (should fail)
    const failRes = await request.post(
      `/api/projects/${projectId}/batches/${batchId}/participants`,
      {
        data: {
          name: "Participant 21",
          email: `p21-${Date.now()}@example.com`,
        },
      }
    );

    expect(failRes.ok()).toBeFalsy();
    expect(failRes.status()).toBe(400);

    const errorBody = await failRes.json();
    expect(errorBody.error).toContain("20");
    console.log(
      `[Batch Validation] Correctly rejected 21st participant: ${errorBody.error}`
    );
  });
});
