import { handlers } from "@/server/auth";

// Node runtime is required (Prisma + bcrypt in the Credentials provider).
export const runtime = "nodejs";

export const { GET, POST } = handlers;
