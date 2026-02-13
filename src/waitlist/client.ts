import type { BetterAuthClientPlugin } from "better-auth/client";
import type { waitlist } from "./server";

export const waitlistClient = () =>
  ({
    id: "waitlist",
    $InferServerPlugin: {} as ReturnType<typeof waitlist>,
  }) satisfies BetterAuthClientPlugin;
