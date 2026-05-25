import axios from "axios";

// Configure axios defaults
axios.defaults.baseURL = "http://localhost:8000";

// Add request interceptor to include auth token
axios.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login on 401
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("department");
      localStorage.removeItem("batch");
      localStorage.removeItem("is_staff");
      localStorage.removeItem("is_superuser");
      // Only redirect if not already on login page
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
