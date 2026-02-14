import { betterAuth } from "better-auth";
import { waitlist } from "better-waitlist";

/**
 * Basic usage - just add the plugin
 */
export const auth = betterAuth({
  plugins: [waitlist()],
});

/**
 * Full configuration example
 */
export const authWithOptions = betterAuth({
  plugins: [
    waitlist({
      // Authentication
      // Require session for admin endpoints (default: true)
      requireAdmin: true,

      // Entry Management
      // Maximum entries allowed (0 = unlimited, default: 0)
      maxEntries: 1000,
      // Allow new waitlist joins (default: true)
      enabled: true,

      // Public Features
      // Allow public status checks (default: true)
      allowStatusCheck: true,
      // Show position in status response (default: false)
      showPosition: true,

      // Invitations
      // Mark as invited when approving (default: false)
      // Note: This only sets the flag - you need to handle email sending via callbacks
      markInvitedOnApprove: true,

      // Position Management
      // Recalculate positions when entries are approved/rejected (default: false)
      // When enabled, pending positions shift up when someone is approved/rejected
      recalculatePositionOnApprove: true,

      // Callbacks
      onJoin: async (entry) => {
        // Called when user joins waitlist
        console.log("New entry:", entry.email);
        console.log("Position:", entry.position);

        // Example: Send notification to admin
        // await sendAdminNotification(entry);
      },

      onApprove: async (entry) => {
        // Called when entry is approved
        console.log("Approved:", entry.email);

        // Example: Send approval email with invite
        // await sendInviteEmail(entry.email);
      },

      onReject: async (entry) => {
        // Called when entry is rejected
        console.log("Rejected:", entry.email);

        // Example: Send rejection email
        // await sendRejectionEmail(entry.email);
      },

      onComplete: async (entry) => {
        // Called when entry is completed (user signs up / removed from waitlist)
        console.log("Completed:", entry.email);

        // Example: Track conversion in analytics
        // await trackConversion(entry);
      },
    }),
  ],
});
