import { apiRequest } from "@/services/apiClient";

const withAuth = { useAuth: true };

export const ownershipChangeService = {
  getOwnershipHistory: () =>
    apiRequest("/auth/ownership-history", {
      ...withAuth,
    }),
};
