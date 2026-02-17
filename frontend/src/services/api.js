import axios from "axios";

// Create axios instance with base URL from environment
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL || "https://api-check.llmtech.in/api",
});

// Request interceptor to add Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor (optional, for handling common errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors like 401 unauthorized
    if (error.response?.status === 401) {
      // Optionally clear token and redirect to login
      localStorage.removeItem("token");
      // window.location.href = '/login'; // Uncomment if needed
    }
    return Promise.reject(error);
  },
);

export const downloadFailedRowsCsv = async (jobId) => {
  try {
    const response = await api.get(`/jobs/${jobId}/failed-rows`, {
      responseType: "blob", // Ensure the response is treated as a file
    });
    console.log(response);

    // Create a link to download the file
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `failed_rows_${jobId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  } catch (error) {
    console.error("Error downloading failed rows CSV:", error);
    throw error;
  }
};

export const authenticate = async () => {
  try {
    const response = await api.get("/auth/authenticate");
    return response.data;
  } catch (err) {
    // normalize unauthorized
    if (err.response?.status === 401) {
      return { authenticated: false };
    }
    throw err;
  }
};

export const downloadAdminProcessedRows = async (from, to) => {
  try {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get(`/admin/download/processed_rows`, {
      params,
      responseType: "blob",
    });

    // Check if response is just headers (empty data)
    const text = await response.data.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length <= 1) {
      // Only headers, no data
      throw new Error("NO_DATA");
    }

    const url = window.URL.createObjectURL(new Blob([text]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `processed_rows_${from || "all"}_${to || "all"}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading processed rows CSV:", error);
    throw error;
  }
};

export const downloadAdminFailedRows = async (from, to) => {
  try {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await api.get(`/admin/download/failed_rows`, {
      params,
      responseType: "blob",
    });

    // Check if response is just headers (empty data)
    const text = await response.data.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length <= 1) {
      // Only headers, no data
      throw new Error("NO_DATA");
    }

    const url = window.URL.createObjectURL(new Blob([text]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `failed_rows_${from || "all"}_${to || "all"}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading admin failed rows CSV:", error);
    throw error;
  }
};

export default api;
