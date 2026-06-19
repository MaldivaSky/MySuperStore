import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Injeta o Authorization header a partir do token em localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Renova o access_token automaticamente se receber 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
          localStorage.setItem("access_token", data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      }
    }
    return Promise.reject(err);
  }
);

// ── Helpers tipados ───────────────────────────────────────────────────────────
export const authApi = {
  register: (data: RegisterPayload) => api.post("/auth/register/", data),
  login: (email: string, password: string) =>
    api.post<TokenPair>("/auth/login/", { email, password }),
  refresh: (refresh: string) => api.post<{ access: string }>("/auth/refresh/", { refresh }),
  me: () => api.get("/users/me/"),
};

export const catalogApi = {
  products: (params?: Record<string, unknown>) => api.get("/catalog/products/", { params }),
  product: (slug: string) => api.get(`/catalog/products/${slug}/`),
  categories: () => api.get("/catalog/categories/"),
};

export const cartApi = {
  get: () => api.get("/cart/"),
  addItem: (variantId: string, quantity: number) =>
    api.post("/cart/items/", { variant_id: variantId, quantity }),
  updateItem: (itemId: string, quantity: number) =>
    api.patch(`/cart/items/${itemId}/`, { quantity }),
  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}/`),
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface RegisterPayload {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

interface TokenPair {
  access: string;
  refresh: string;
}
