import axios from "axios";
import { config } from "@/config/environment";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

// Simple logger function
const apiLogger = {
  request: (method: string, url: string, data?: any) => {
    console.log(
      `%c API Request: ${method.toUpperCase()} ${url}`,
      'color: #61AFEF; font-weight: bold;',
      data || ''
    );
  },
  response: (status: number, method: string, url: string, data?: any) => {
    console.log(
      `%c API Response: ${status} ${method.toUpperCase()} ${url}`,
      'color: #98C379; font-weight: bold;',
      data || ''
    );
  },
  error: (status: number | string, method?: string, url?: string, error?: any) => {
    console.log(
      `%c API Error: ${status} ${method?.toUpperCase() || ''} ${url || ''}`,
      'color: #E06C75; font-weight: bold;',
      error || ''
    );
  }
};

const apiClient = axios.create({
  baseURL: config.server.apiUrl,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Log the request
    apiLogger.request(
      config.method || '',
      config.url || '',
      config.data
    );
    
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    // Log the successful response
    apiLogger.response(
      response.status,
      response.config.method || '',
      response.config.url || '',
      response.data
    );
    
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        useAuthStore.getState().logout();
      }

      const errorMessage = error.response.data?.error || "An error occurred";
      toast.error(errorMessage);
      
      // Log the error response
      apiLogger.error(
        error.response.status,
        error.config?.method,
        error.config?.url,
        error.response.data
      );
    } else {
      // Log network errors
      apiLogger.error(
        "Network Error",
        error.config?.method,
        error.config?.url,
        error.message
      );
    }

    return Promise.reject(error);
  }
);

export default apiClient;
