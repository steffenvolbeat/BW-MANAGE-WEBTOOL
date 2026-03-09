import { prisma } from "@/lib/database";

// Simple RLS/ABAC scoping layer for user-owned resources.
// Enforces userId scoping on CRUD for owned models.

type Where = Record<string, unknown> | undefined;
type Data = Record<string, unknown> | undefined;

type ScopedModel = {
  findMany: (args?: { where?: Where; include?: any; select?: any; orderBy?: any }) => Promise<any>;
  findFirst: (args?: { where?: Where; include?: any; select?: any; orderBy?: any }) => Promise<any>;
  create: (args: { data: Data; include?: any; select?: any }) => Promise<any>;
  update: (args: { where: Where; data: Data; include?: any; select?: any }) => Promise<any>;
  delete: (args: { where: Where }) => Promise<any>;
};

function withUserWhere(where: Where, userId: string): Where {
  return { ...(where || {}), userId };
}

function enforceOwnedModel(model: keyof typeof prisma, userId: string): ScopedModel {
  const m: any = (prisma as any)[model];
  return {
    findMany: (args = {}) => m.findMany({ ...args, where: withUserWhere(args.where, userId) }),
    findFirst: (args = {}) => m.findFirst({ ...args, where: withUserWhere(args.where, userId) }),
    create: (args) => m.create({ ...args, data: { ...(args.data || {}), userId } }),
    update: (args) => m.update({ ...args, where: withUserWhere(args.where, userId) }),
    delete: (args) => m.delete({ ...args, where: withUserWhere(args.where, userId) }),
  };
}

export function scopedPrisma(userId: string) {
  return {
    document: enforceOwnedModel("document", userId),
    application: enforceOwnedModel("application", userId),
    contact: enforceOwnedModel("contact", userId),
    note: enforceOwnedModel("note", userId),
    event: enforceOwnedModel("event", userId),
    activity: enforceOwnedModel("activity", userId),
    meeting: enforceOwnedModel("meeting", userId),
    reminder: enforceOwnedModel("reminder", userId),
    // expose raw prisma for non-owned models if needed (admin-only)
    raw: prisma,
  } as const;
}
