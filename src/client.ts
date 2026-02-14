import type { BetterAuthClientPlugin } from "better-auth/client";
import type { waitlist } from "./server";

declare module "better-auth/client" {
  interface Register {
    waitlist: ReturnType<typeof waitlist>;
  }
}

export const waitlistClient = () =>
  ({
    id: "waitlist",
    $InferServerPlugin: {} as ReturnType<typeof waitlist>,
  }) satisfies BetterAuthClientPlugin;
