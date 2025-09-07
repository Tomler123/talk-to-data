import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000",         // ← your Flask backend
  headers: { "Content-Type": "application/json" }
});

instance.interceptors.request.use((config) => {
  // const token = localStorage.getItem("token");
  const token = localStorage.getItem("access_token");  // match your login code
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default instance;
