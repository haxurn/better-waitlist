import { betterAuth } from "better-auth";
import { waitlist } from "better-waitlist";

export const auth = betterAuth({
  plugins: [waitlist()],
});

export const authWithOptions = betterAuth({
  plugins: [
    waitlist({
      requireAdmin: true,
      maxEntries: 1000,
      enabled: true,
      allowStatusCheck: true,
      showPosition: true,
      markInvitedOnApprove: true,
      recalculatePositionOnApprove: true,

      onJoin: async (entry) => {
        console.log("New entry:", entry.email);
        console.log("Position:", entry.position);
      },

      onApprove: async (entry) => { 
        console.log("Approved:", entry.email);
      },

      onReject: async (entry) => {
        console.log("Rejected:", entry.email);
      },

      onComplete: async (entry) => {
        console.log("Completed:", entry.email);
      },
    }),
  ],
});
