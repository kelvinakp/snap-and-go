// API calls now go through the Next.js rewrite proxy (/api/* -> backend:8000/api/*).
// No hardcoded backend URL needed — works seamlessly over ngrok tunnels.
export const API_BASE = "";
