import { APIError, createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import type { BetterAuthPlugin, BetterAuthPluginDBSchema } from "better-auth";
import { z } from "zod";
import type { WaitlistPluginOptions, WaitlistStatus, WaitlistEntry, WaitlistStats } from "./types";

interface WaitlistEntryRecord {
  id: string;
  email: string;
  status: string;
  position: number;
  userId: string | null;
  invitedAt: Date | null;
  createdAt: Date;
}

function toEntryResponse(entry: WaitlistEntryRecord): WaitlistEntry {
  return {
    id: entry.id,
    email: entry.email,
    status: entry.status as WaitlistStatus,
    position: entry.position,
    userId: entry.userId,
    invitedAt: entry.invitedAt,
    createdAt: entry.createdAt,
  };
}

export const waitlist = (options: WaitlistPluginOptions = {}) => {
  const {
    requireAdmin = true,
    maxEntries = 0,
    enabled = true,
    allowStatusCheck = true,
    showPosition = false,
    sendInviteOnApprove = false,
    onJoin,
    onApprove,
    onReject,
    onSignUp,
  } = options;

  const schema: BetterAuthPluginDBSchema = {
    waitlist: {
      fields: {
        email: {
          type: "string",
          required: true,
          unique: true,
        },
        status: {
          type: "string",
          required: true,
          defaultValue: "pending",
        },
        position: {
          type: "number",
          required: true,
        },
        userId: {
          type: "string",
          required: false,
        },
        invitedAt: {
          type: "date",
          required: false,
        },
        createdAt: {
          type: "date",
          required: true,
          defaultValue: () => new Date(),
        },
      },
    },
  };

  return {
    id: "waitlist",
    schema,
    endpoints: {
      joinWaitlist: createAuthEndpoint(
        "/waitlist/join",
        {
          method: "POST",
          body: z.object({
            email: z.string().email(),
            userId: z.string().optional(),
          }),
        },
        async (ctx) => {
          if (!enabled) {
            throw new APIError("FORBIDDEN", {
              message: "Waitlist is closed",
            });
          }

          const adapter = ctx.context.adapter;
          const email = ctx.body.email.toLowerCase().trim();
          const userId = ctx.body.userId;

          if (maxEntries > 0) {
            const count = await adapter.count({ model: "waitlist" });
            if (count >= maxEntries) {
              throw new APIError("FORBIDDEN", {
                message: "Waitlist is full",
              });
            }
          }

          const existing = await adapter.findOne<WaitlistEntryRecord>({
            model: "waitlist",
            where: [{ field: "email", value: email }],
          });

          if (existing) {
            throw new APIError("BAD_REQUEST", {
              message: "Email already on waitlist",
            });
          }

          const count = await adapter.count({
            model: "waitlist",
          });

          const entry = await adapter.create<WaitlistEntryRecord>({
            model: "waitlist",
            data: {
              email,
              status: "pending",
              position: count + 1,
              userId: userId ?? null,
              invitedAt: null,
              createdAt: new Date(),
            },
          });

          const response = toEntryResponse(entry);

          if (onJoin) {
            await onJoin(response);
          }

          return ctx.json(response);
        },
      ),

      getWaitlistStatus: createAuthEndpoint(
        "/waitlist/status",
        {
          method: "GET",
          query: z.object({
            email: z.string().email(),
          }),
        },
        async (ctx) => {
          if (!allowStatusCheck) {
            throw new APIError("FORBIDDEN", {
              message: "Status check is disabled",
            });
          }

          const email = ctx.query.email.toLowerCase().trim();
          const adapter = ctx.context.adapter;

          const entry = await adapter.findOne<WaitlistEntryRecord>({
            model: "waitlist",
            where: [{ field: "email", value: email }],
          });

          if (!entry) {
            throw new APIError("NOT_FOUND", {
              message: "Email not found in waitlist",
            });
          }

          const response: Record<string, unknown> = {
            email: entry.email,
            status: entry.status as WaitlistStatus,
            createdAt: entry.createdAt,
          };

          if (showPosition) {
            response.position = entry.position;
          }

          return ctx.json(response);
        },
      ),

      getWaitlistPosition: createAuthEndpoint(
        "/waitlist/position",
        {
          method: "GET",
          query: z.object({
            email: z.string().email(),
          }),
        },
        async (ctx) => {
          const email = ctx.query.email.toLowerCase().trim();
          const adapter = ctx.context.adapter;

          const entry = await adapter.findOne<WaitlistEntryRecord>({
            model: "waitlist",
            where: [{ field: "email", value: email }],
          });

          if (!entry) {
            throw new APIError("NOT_FOUND", {
              message: "Email not found in waitlist",
            });
          }

          return ctx.json({
            email: entry.email,
            position: entry.position,
            status: entry.status as WaitlistStatus,
          });
        },
      ),

      listWaitlist: createAuthEndpoint(
        "/waitlist/list",
        {
          method: "GET",
          query: z.object({
            status: z.enum(["pending", "approved", "rejected"]).optional(),
            limit: z.number().int().min(1).max(100).default(20),
            offset: z.number().int().min(0).default(0),
          }),
          use: requireAdmin ? [sessionMiddleware] : [],
        },
        async (ctx) => {
          if (requireAdmin && !ctx.context.session) {
            throw new APIError("UNAUTHORIZED", {
              message: "Authentication required",
            });
          }

          const adapter = ctx.context.adapter;
          const { status, limit, offset } = ctx.query;
          const where = status ? [{ field: "status", value: status }] : [];

          const [entries, total] = await Promise.all([
            adapter.findMany<WaitlistEntryRecord>({
              model: "waitlist",
              where,
              sortBy: { field: "position", direction: "asc" },
              limit,
              offset,
            }),
            adapter.count({
              model: "waitlist",
              where,
            }),
          ]);

          return ctx.json({
            entries: entries.map(toEntryResponse),
            total,
          });
        },
      ),

      waitlistStats: createAuthEndpoint(
        "/waitlist/stats",
        {
          method: "GET",
          use: requireAdmin ? [sessionMiddleware] : [],
        },
        async (ctx) => {
          if (requireAdmin && !ctx.context.session) {
            throw new APIError("UNAUTHORIZED", {
              message: "Authentication required",
            });
          }

          const adapter = ctx.context.adapter;

          const [pending, approved, rejected, total] = await Promise.all([
            adapter.count({ model: "waitlist", where: [{ field: "status", value: "pending" }] }),
            adapter.count({ model: "waitlist", where: [{ field: "status", value: "approved" }] }),
            adapter.count({ model: "waitlist", where: [{ field: "status", value: "rejected" }] }),
            adapter.count({ model: "waitlist" }),
          ]);

          return ctx.json({
            total,
            pending,
            approved,
            rejected,
          } as WaitlistStats);
        },
      ),

      approveWaitlistEntry: createAuthEndpoint(
        "/waitlist/approve",
        {
          method: "POST",
          body: z.object({
            email: z.string().email(),
            sendInvite: z.boolean().optional(),
          }),
          use: requireAdmin ? [sessionMiddleware] : [],
        },
        async (ctx) => {
          if (requireAdmin && !ctx.context.session) {
            throw new APIError("UNAUTHORIZED", {
              message: "Authentication required",
            });
          }

          const email = ctx.body.email.toLowerCase().trim();
          const sendInvite = ctx.body.sendInvite ?? sendInviteOnApprove;
          const adapter = ctx.context.adapter;

          const entry = await adapter.findOne<WaitlistEntryRecord>({
            model: "waitlist",
            where: [{ field: "email", value: email }],
          });

          if (!entry) {
            throw new APIError("NOT_FOUND", {
              message: "Email not found in waitlist",
            });
          }

          if (entry.status === "approved") {
            throw new APIError("BAD_REQUEST", {
              message: "Entry is already approved",
            });
          }

          const updateData: Partial<WaitlistEntryRecord> = { status: "approved" };

          if (sendInvite) {
            updateData.invitedAt = new Date();
          }

          const updated = await adapter.update<WaitlistEntryRecord>({
            model: "waitlist",
            update: updateData,
            where: [{ field: "id", value: entry.id }],
          });

          if (!updated) {
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Failed to update waitlist entry",
            });
          }

          const response = toEntryResponse(updated);

          if (onApprove) {
            await onApprove(response);
          }

          return ctx.json(response);
        },
      ),

      rejectWaitlistEntry: createAuthEndpoint(
        "/waitlist/reject",
        {
          method: "POST",
          body: z.object({
            email: z.string().email(),
          }),
          use: requireAdmin ? [sessionMiddleware] : [],
        },
        async (ctx) => {
          if (requireAdmin && !ctx.context.session) {
            throw new APIError("UNAUTHORIZED", {
              message: "Authentication required",
            });
          }

          const email = ctx.body.email.toLowerCase().trim();
          const adapter = ctx.context.adapter;

          const entry = await adapter.findOne<WaitlistEntryRecord>({
            model: "waitlist",
            where: [{ field: "email", value: email }],
          });

          if (!entry) {
            throw new APIError("NOT_FOUND", {
              message: "Email not found in waitlist",
            });
          }

          if (entry.status === "rejected") {
            throw new APIError("BAD_REQUEST", {
              message: "Entry is already rejected",
            });
          }

          const updated = await adapter.update<WaitlistEntryRecord>({
            model: "waitlist",
            update: { status: "rejected" },
            where: [{ field: "id", value: entry.id }],
          });

          if (!updated) {
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Failed to update waitlist entry",
            });
          }

          const response = toEntryResponse(updated);

          if (onReject) {
            await onReject(response);
          }

          return ctx.json(response);
        },
      ),

      promoteWaitlistEntry: createAuthEndpoint(
        "/waitlist/promote",
        {
          method: "POST",
          body: z.object({
            email: z.string().email(),
          }),
          use: requireAdmin ? [sessionMiddleware] : [],
        },
        async (ctx) => {
          if (requireAdmin && !ctx.context.session) {
            throw new APIError("UNAUTHORIZED", {
              message: "Authentication required",
            });
          }

          const email = ctx.body.email.toLowerCase().trim();
          const adapter = ctx.context.adapter;

          const entry = await adapter.findOne<WaitlistEntryRecord>({
            model: "waitlist",
            where: [{ field: "email", value: email }],
          });

          if (!entry) {
            throw new APIError("NOT_FOUND", {
              message: "Email not found in waitlist",
            });
          }

          if (entry.status !== "approved") {
            throw new APIError("BAD_REQUEST", {
              message: "Entry must be approved before promoting",
            });
          }

          if (entry.invitedAt) {
            throw new APIError("BAD_REQUEST", {
              message: "Invite already sent",
            });
          }

          const updated = await adapter.update<WaitlistEntryRecord>({
            model: "waitlist",
            update: { invitedAt: new Date() },
            where: [{ field: "id", value: entry.id }],
          });

          if (!updated) {
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Failed to promote waitlist entry",
            });
          }

          return ctx.json(toEntryResponse(updated));
        },
      ),

      promoteAllWaitlist: createAuthEndpoint(
        "/waitlist/promote-all",
        {
          method: "POST",
          body: z.object({
            status: z.enum(["pending", "approved"]).optional().default("approved"),
          }),
          use: requireAdmin ? [sessionMiddleware] : [],
        },
        async (ctx) => {
          if (requireAdmin && !ctx.context.session) {
            throw new APIError("UNAUTHORIZED", {
              message: "Authentication required",
            });
          }

          const status = ctx.body.status;
          const adapter = ctx.context.adapter;

          const entries = await adapter.findMany<WaitlistEntryRecord>({
            model: "waitlist",
            where: [
              { field: "status", value: status },
              ...(status === "approved" ? [{ field: "invitedAt", value: null }] : []),
            ],
            sortBy: { field: "position", direction: "asc" },
          });

          const updatedEntries: WaitlistEntry[] = [];

          for (const entry of entries) {
            const updated = await adapter.update<WaitlistEntryRecord>({
              model: "waitlist",
              update: { invitedAt: new Date() },
              where: [{ field: "id", value: entry.id }],
            });

            if (updated) {
              updatedEntries.push(toEntryResponse(updated));
            }
          }

          return ctx.json({
            promoted: updatedEntries.length,
            entries: updatedEntries,
          });
        },
      ),

      removeWaitlistEntry: createAuthEndpoint(
        "/waitlist/remove",
        {
          method: "POST",
          body: z.object({
            email: z.string().email(),
          }),
          use: requireAdmin ? [sessionMiddleware] : [],
        },
        async (ctx) => {
          if (requireAdmin && !ctx.context.session) {
            throw new APIError("UNAUTHORIZED", {
              message: "Authentication required",
            });
          }

          const email = ctx.body.email.toLowerCase().trim();
          const adapter = ctx.context.adapter;

          const entry = await adapter.findOne<WaitlistEntryRecord>({
            model: "waitlist",
            where: [{ field: "email", value: email }],
          });

          if (!entry) {
            throw new APIError("NOT_FOUND", {
              message: "Email not found in waitlist",
            });
          }

          const response = toEntryResponse(entry);

          if (onSignUp) {
            await onSignUp(response);
          }

          await adapter.delete({
            model: "waitlist",
            where: [{ field: "id", value: entry.id }],
          });

          return ctx.json({ success: true, entry: response });
        },
      ),
    },
  } satisfies BetterAuthPlugin;
};
