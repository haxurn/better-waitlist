import { APIError, createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import type { BetterAuthPlugin, BetterAuthPluginDBSchema } from "better-auth";
import { z } from "zod";
import type { WaitlistPluginOptions, WaitlistStatus } from "./types";

interface WaitlistEntryRecord {
  id: string;
  email: string;
  status: string;
  position: number;
  userId: string | null;
  createdAt: Date;
}

function toEntryResponse(entry: WaitlistEntryRecord) {
  return {
    id: entry.id,
    email: entry.email,
    status: entry.status as WaitlistStatus,
    position: entry.position,
    userId: entry.userId,
    createdAt: entry.createdAt,
  };
}

export const waitlist = (options: WaitlistPluginOptions = {}) => {
  const requireAdmin = options.requireAdmin ?? true;

  const schema: BetterAuthPluginDBSchema = {
    waitlistEntry: {
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
          references: {
            model: "user",
            field: "id",
          },
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
          const adapter = ctx.context.adapter;
          const email = ctx.body.email.toLowerCase().trim();
          const userId = ctx.body.userId;

          const existing = await adapter.findOne<WaitlistEntryRecord>({
            model: "waitlistEntry",
            where: [{ field: "email", value: email }],
          });

          if (existing) {
            throw new APIError("BAD_REQUEST", {
              message: "Email already on waitlist",
            });
          }

          const count = await adapter.count({
            model: "waitlistEntry",
          });

          const entry = await adapter.create<WaitlistEntryRecord>({
            model: "waitlistEntry",
            data: {
              email,
              status: "pending",
              position: count + 1,
              userId: userId ?? null,
              createdAt: new Date(),
            },
          });

          return ctx.json(toEntryResponse(entry));
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
          const email = ctx.query.email.toLowerCase().trim();
          const adapter = ctx.context.adapter;

          const entry = await adapter.findOne<WaitlistEntryRecord>({
            model: "waitlistEntry",
            where: [{ field: "email", value: email }],
          });

          if (!entry) {
            throw new APIError("NOT_FOUND", {
              message: "Email not found in waitlist",
            });
          }

          return ctx.json({
            email: entry.email,
            status: entry.status as WaitlistStatus,
            createdAt: entry.createdAt,
          });
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
            model: "waitlistEntry",
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
              model: "waitlistEntry",
              where,
              sortBy: { field: "position", direction: "asc" },
              limit,
              offset,
            }),
            adapter.count({
              model: "waitlistEntry",
              where,
            }),
          ]);

          return ctx.json({
            entries: entries.map(toEntryResponse),
            total,
          });
        },
      ),

      approveWaitlistEntry: createAuthEndpoint(
        "/waitlist/approve",
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
            model: "waitlistEntry",
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

          const updated = await adapter.update<WaitlistEntryRecord>({
            model: "waitlistEntry",
            update: { status: "approved" },
            where: [{ field: "id", value: entry.id }],
          });

          if (!updated) {
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Failed to update waitlist entry",
            });
          }

          return ctx.json(toEntryResponse(updated));
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
            model: "waitlistEntry",
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
            model: "waitlistEntry",
            update: { status: "rejected" },
            where: [{ field: "id", value: entry.id }],
          });

          if (!updated) {
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "Failed to update waitlist entry",
            });
          }

          return ctx.json(toEntryResponse(updated));
        },
      ),
    },
  } satisfies BetterAuthPlugin;
};
