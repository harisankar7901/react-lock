import axios from 'axios';

const api = axios.create({
    // baseURL: 'http://localhost:5000/api/',
	  // baseURL:'http://3.108.136.104:5000/api'
    baseURL: 'http://sankarworld.online/api'
    // baseURL:'http://187.53.133.136/api/'
});

// Attach token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle expired/invalid token globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      // Avoid redirect loop if already on login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default api;