import { ApiResponse, InternalRole } from "@/types/types";

export interface BusinessNote {
  id: string;
  businessId: string;
  authorUserId: string;
  authorEmail: string | null;
  authorName: string | null;
  authorRole: InternalRole | string | null;
  content: string;
  pinned: boolean;
  pinnedAt: string | null;
  pinnedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BusinessNotePage = ApiResponse<BusinessNote>;

export interface CreateBusinessNoteRequest {
  content: string;
  pinned?: boolean;
}

export interface UpdateBusinessNoteRequest {
  content: string;
}
