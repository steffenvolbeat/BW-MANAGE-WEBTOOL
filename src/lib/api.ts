// API response wrapper for consistent error handling
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Application fetching hooks
export const apiClient = {
  // Generic API call wrapper
  async call<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  },

  // Applications API
  applications: {
    async getAll(userId: string) {
      return apiClient.call(`/api/applications?userId=${userId}`);
    },

    async create(data: any) {
      return apiClient.call("/api/applications", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async update(data: any) {
      return apiClient.call("/api/applications", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    async delete(id: string, userId: string) {
      return apiClient.call(`/api/applications?id=${id}&userId=${userId}`, {
        method: "DELETE",
      });
    },
  },

  // Contacts API
  contacts: {
    async getAll(userId: string) {
      return apiClient.call(`/api/contacts?userId=${userId}`);
    },

    async create(data: any) {
      return apiClient.call("/api/contacts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async update(data: any) {
      return apiClient.call("/api/contacts", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    async delete(id: string, userId: string) {
      return apiClient.call(`/api/contacts?id=${id}&userId=${userId}`, {
        method: "DELETE",
      });
    },
  },

  // Activities API
  activities: {
    async getAll(userId: string, applicationId?: string, contactId?: string) {
      const params = new URLSearchParams({ userId });
      if (applicationId) params.append("applicationId", applicationId);
      if (contactId) params.append("contactId", contactId);

      return apiClient.call(`/api/activities?${params.toString()}`);
    },

    async create(data: any) {
      return apiClient.call("/api/activities", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async update(data: any) {
      return apiClient.call("/api/activities", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    async delete(id: string, userId: string) {
      return apiClient.call(`/api/activities?id=${id}&userId=${userId}`, {
        method: "DELETE",
      });
    },
  },

  // Documents API
  documents: {
    async getAll(userId: string, applicationId?: string) {
      const params = new URLSearchParams({ userId });
      if (applicationId) params.append("applicationId", applicationId);

      return apiClient.call(`/api/documents?${params.toString()}`);
    },

    async create(data: any) {
      return apiClient.call("/api/documents", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async update(data: any) {
      return apiClient.call("/api/documents", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    async delete(id: string, userId: string) {
      return apiClient.call(`/api/documents?id=${id}&userId=${userId}`, {
        method: "DELETE",
      });
    },
  },

  // Events API
  events: {
    async getAll(userId: string, startDate?: string, endDate?: string) {
      const params = new URLSearchParams({ userId });
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      return apiClient.call(`/api/events?${params.toString()}`);
    },

    async create(data: any) {
      return apiClient.call("/api/events", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async update(data: any) {
      return apiClient.call("/api/events", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    async delete(id: string, userId: string) {
      return apiClient.call(`/api/events?id=${id}&userId=${userId}`, {
        method: "DELETE",
      });
    },
  },

  // Analytics API
  analytics: {
    async getAll(userId: string) {
      return apiClient.call(`/api/analytics?userId=${userId}`);
    },
  },
};
