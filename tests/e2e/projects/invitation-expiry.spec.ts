import { test, expect } from "@playwright/test";

test.describe("Invitation expiry logic", () => {
  test("API correctly handles invitation resend for expired invitations", async ({
    request,
  }) => {
    const title = test.info().title;
    console.log(`[Test: ${title}] Testing invitation expiry via API...`);

    // The seed data has seed-participant-4 with an expired invitation (dedicated for this API test)
    // Try to resend invitation
    const resendRes = await request.patch(
      "/api/projects/seed-project-1/invitations",
      {
        data: { participantId: "seed-participant-4" },
      }
    );

    expect(resendRes.ok()).toBeTruthy();
    const invitation = await resendRes.json();
    expect(invitation.status).toBe("sent");
    expect(invitation.expiresAt).toBeTruthy();

    // Verify new expiry is ~7 days from now
    const expiresAt = new Date(invitation.expiresAt);
    const now = new Date();
    const diffDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(6);
    expect(diffDays).toBeLessThan(8);

    console.log(`[Invitation Expiry] Resent invitation, new expiry: ${invitation.expiresAt}`);
  });

  test("API rejects resend for non-expired invitation", async ({
    request,
  }) => {
    const title = test.info().title;
    console.log(`[Test: ${title}] Testing resend rejection for active invitation...`);

    // seed-participant-1 has a "sent" (active) invitation
    const resendRes = await request.patch(
      "/api/projects/seed-project-1/invitations",
      {
        data: { participantId: "seed-participant-1" },
      }
    );

    expect(resendRes.ok()).toBeFalsy();
    expect(resendRes.status()).toBe(400);

    const errorBody = await resendRes.json();
    expect(errorBody.error).toContain("not expired");
    console.log(`[Invitation Expiry] Correctly rejected resend: ${errorBody.error}`);
  });
});
