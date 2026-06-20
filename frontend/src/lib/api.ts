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
  updateProfile: (data: any) => api.put("/users/me/", data),
};

export const catalogApi = {
  products: (params?: Record<string, unknown>) => api.get("/catalog/products/", { params }),
  product: (slug: string) => api.get(`/catalog/products/${slug}/`),
  categories: () => api.get("/catalog/categories/"),
  tree: () => api.get("/catalog/categories/tree/"),
  setPromo: (slug: string, data: { promotional_price: number | null, promo_ends_at: string | null }) => 
    api.patch(`/catalog/products/${slug}/set-promo/`, data),
};

export const cartApi = {
  get: () => api.get("/cart/"),
  addItem: (variantId: string, quantity: number) =>
    api.post("/cart/items/", { variant_id: variantId, quantity }),
  updateItem: (itemId: string, quantity: number) =>
    api.patch(`/cart/items/${itemId}/`, { quantity }),
  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}/`),
};

export const sellerApi = {
  me: () => api.get("/sellers/me/"),
  apply: (data: { store_name: string; description: string; pix_key: string }) =>
    api.post("/sellers/apply/", data),
  onboard: (returnUrl: string, refreshUrl: string) =>
    api.post<{ onboarding_url: string }>("/sellers/me/stripe-onboard/", {
      return_url: returnUrl,
      refresh_url: refreshUrl,
    }),
  stripeCallback: () => api.get("/sellers/me/stripe-callback/"),
};

export const ordersApi = {
  getAll: () => api.get("/orders/"),
  get: (orderNumber: string) => api.get(`/orders/${orderNumber}/`),
  create: (data: any) => api.post("/orders/", data),
};

export type PaymentMethodChoice = "pix" | "credit_card" | "debit_card";

export const paymentsApi = {
  createIntent: (orderId: string, method: PaymentMethodChoice) =>
    api.post("/payments/create-intent/", { order_id: orderId, payment_method: method }),
  confirm: (paymentId: string) => api.post(`/payments/${paymentId}/confirm/`),
  simulatePix: (paymentId: string) => api.post(`/payments/${paymentId}/simulate-pix/`),
  cancel: (paymentId: string) => api.post(`/payments/${paymentId}/cancel/`),
  refund: (paymentId: string, amount?: number) =>
    api.post(`/payments/${paymentId}/refund/`, amount != null ? { amount } : {}),
  status: (paymentId: string) => api.get(`/payments/${paymentId}/`),
};

export const returnsApi = {
  requestReturn: (orderItemId: string, reason: string, customerNotes: string) => 
    api.post("/orders/returns/", {
      order_item_id: orderItemId,
      reason,
      customer_notes: customerNotes
    }),
  updateStatus: (returnId: string, status: string, sellerNotes?: string) => 
    api.patch(`/orders/returns/${returnId}/update_status/`, {
      status,
      seller_notes: sellerNotes
    }),
};

export const wishlistApi = {
  get: async () => {
    const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
    return { data: list };
  },
  add: async (product: any) => {
    const list = JSON.parse(localStorage.getItem("wishlist") || "[]");
    if (!list.find((item: any) => item.product.id === product.id)) {
      list.push({ id: product.id, product });
      localStorage.setItem("wishlist", JSON.stringify(list));
    }
    return { data: { success: true } };
  },
  remove: async (productId: string) => {
    let list = JSON.parse(localStorage.getItem("wishlist") || "[]");
    list = list.filter((item: any) => item.product.id !== productId);
    localStorage.setItem("wishlist", JSON.stringify(list));
    return { data: { success: true } };
  },
};

export const reviewApi = {
  getReviews: (productSlug: string) => api.get(`/catalog/products/${productSlug}/reviews/`),
  submit: (productSlug: string, data: { rating: number; subject: string; body: string }) => 
    api.post(`/catalog/products/${productSlug}/reviews/`, data),
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface RegisterPayload {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: string;
  password: string;
  password_confirm: string;
}

interface TokenPair {
  access: string;
  refresh: string;
}
