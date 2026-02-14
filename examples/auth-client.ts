import { createAuthClient } from "better-auth/client";
import { waitlistClient } from "better-waitlist";

/**
 * Client setup
 */
export const authClient = createAuthClient({
  plugins: [waitlistClient()],
});

// ============================================
// User Actions (no auth required)
// ============================================

/**
 * Join the waitlist
 * Used by: Anonymous users or logged-in users
 */
async function joinWaitlist() {
  // Anonymous user
  const { data: anonymousEntry, error: anonError } =
    await authClient.waitlist.join({
      email: "user@example.com",
    });

  // Logged-in user (optional userId)
  const { data: userEntry, error: userError } =
    await authClient.waitlist.join({
      email: "user@example.com",
      userId: "user-123", // Optional: link to existing user
    });

  if (userEntry) {
    console.log("Joined at position:", userEntry.position);
  }
}

/**
 * Check waitlist status
 * Used by: Anyone wanting to check their status
 */
async function checkStatus() {
  const { data, error } = await (authClient.waitlist as any).status({
    email: "user@example.com",
  });

  if (data) {
    console.log("Status:", data.status); // "pending" | "approved" | "rejected"
    console.log("Position:", data.position); // Only shown if showPosition is enabled
    console.log("Created at:", data.createdAt);
  }
}

/**
 * Check waitlist position
 * Used by: Anyone wanting to know their position
 */
async function checkPosition() {
  const { data, error } = await (authClient.waitlist as any).position({
    email: "user@example.com",
  });

  if (data) {
    console.log("Position:", data.position);
    console.log("Status:", data.status);
  }
}

// ============================================
// Admin Actions (require auth)
// ============================================

/**
 * List waitlist entries
 * Used by: Admin only
 */
async function listEntries() {
  const { data, error } = await (authClient.waitlist as any).list({
    status: "pending", // Optional: filter by status
    limit: 20,
    offset: 0,
  });

  if (data) {
    console.log("Total entries:", data.total);
    data.entries.forEach((entry: any) => {
      console.log(
        `${entry.position}. ${entry.email} - ${entry.status}`
      );
    });
  }
}

/**
 * Get waitlist statistics
 * Used by: Admin only
 */
async function getStats() {
  const { data, error } = await authClient.waitlist.stats();

  if (data) {
    console.log("Total:", data.total);
    console.log("Pending:", data.pending);
    console.log("Approved:", data.approved);
    console.log("Rejected:", data.rejected);
  }
}

/**
 * Approve a waitlist entry
 * Used by: Admin only
 */
async function approveEntry() {
  const { data, error } = await authClient.waitlist.approve({
    email: "user@example.com",
  });

  // With invite flag override
  const { data: data2, error: error2 } =
    await authClient.waitlist.approve({
      email: "user@example.com",
      sendInvite: true, // Override plugin setting for this call
    });

  if (data) {
    console.log("Approved:", data.email);
  }
}

/**
 * Reject a waitlist entry
 * Used by: Admin only
 */
async function rejectEntry() {
  const { data, error } = await authClient.waitlist.reject({
    email: "user@example.com",
  });

  if (data) {
    console.log("Rejected:", data.email);
  }
}

/**
 * Promote a single entry (send invite)
 * Used by: Admin only
 */
async function promoteEntry() {
  const { data, error } = await authClient.waitlist.promote({
    email: "user@example.com",
  });

  if (data) {
    console.log("Promoted:", data.email);
    console.log("Invited at:", data.invitedAt);
  }
}

/**
 * Promote all entries (bulk send invites)
 * Used by: Admin only
 */
async function promoteAll() {
  const { data, error } = await authClient.waitlist.promoteAll({
    status: "approved", // Default: "approved"
  });

  if (data) {
    console.log("Promoted count:", data.promoted);
    data.entries.forEach((entry: any) => {
      console.log(`Invited: ${entry.email}`);
    });
  }
}

/**
 * Complete an entry (user signed up / remove from waitlist)
 * Used by: Admin only
 */
async function completeEntry() {
  const { data, error } = await authClient.waitlist.complete({
    email: "user@example.com",
  });

  if (data) {
    console.log("Completed entry:", data.entry.email);
    // Entry is now removed from waitlist
  }
}
