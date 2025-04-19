// Helper functions for API calls

/**
 * Get the API URL from environment variables
 */
export const getApiUrl = (path: string): string => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

/**
 * Make an authenticated API request
 */
export const fetchWithAuth = async (
  path: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  return fetch(getApiUrl(path), {
    ...options,
    headers,
  });
};
