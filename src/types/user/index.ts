import type { Request } from "express";

export interface AuthUser {
    id?: string | null;
    email?: string | null;
    name?: string | null;
    image?: string | null;
}

export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}
