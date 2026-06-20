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
  brands: () => api.get("/catalog/brands/"),
  setPromo: (slug: string, data: { promotional_price: number | null, promo_ends_at: string | null }) => 
    api.patch(`/catalog/products/${slug}/set-promo/`, data),
  track: (slug: string, type: "view" | "click") => api.post(`/catalog/products/${slug}/track/`, { type }),
};

export const cartApi = {
  get: () => api.get("/cart/"),
  addItem: (variantId: string, quantity: number) =>
    api.post("/cart/items/", { variant_id: variantId, quantity }),
  updateItem: (itemId: string, quantity: number) =>
    api.patch(`/cart/items/${itemId}/`, { quantity }),
  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}/`),
  triggerAbandonedEmails: () => api.post("/cart/trigger-abandoned-emails/"),
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
  get: () => api.get("/catalog/wishlist/my/"),
  add: (product: any) => api.post("/catalog/wishlist/add/", { product_id: product.id }),
  remove: (productId: string) => api.post("/catalog/wishlist/remove/", { product_id: productId }),
};

export const reviewApi = {
  getReviews: (productSlug: string) => api.get(`/catalog/products/${productSlug}/reviews/`),
  submit: (productSlug: string, data: { rating: number; subject: string; body: string }) => 
    api.post(`/catalog/products/${productSlug}/reviews/`, data),
};

export const userApi = {
  getSurvey: () => api.get("/users/me/survey/"),
  saveSurvey: (data: any) => api.post("/users/me/survey/", data),
};

export const chatApi = {
  listRooms: () => api.get("/sellers/me/chats/"),
  createRoom: (data: { seller_id?: string; product_id?: string; customer_id?: string }) => 
    api.post("/sellers/me/chats/create/", data),
  sendMessage: (roomId: string, message: string) => 
    api.post(`/sellers/me/chats/${roomId}/messages/`, { message }),
};

export const sellerDashboardApi = {
  getLeads: () => api.get("/sellers/me/leads/"),
  getMentor: () => api.get("/sellers/me/mentor/"),
  triggerMentorAction: (action: string, productSlug: string) => 
    api.post("/sellers/me/mentor/", { action, product_slug: productSlug }),
  products: {
    list: () => api.get("/sellers/me/products/"),
    create: (data: any) => api.post("/sellers/me/products/", data),
    update: (id: string, data: any) => api.patch(`/sellers/me/products/${id}/`, data),
    delete: (id: string) => api.delete(`/sellers/me/products/${id}/`),
    uploadImage: (productId: string, formData: FormData) => 
      api.post(`/sellers/me/products/${productId}/images/`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      }),
    deleteImage: (productId: string, imageId: string) => 
      api.delete(`/sellers/me/products/${productId}/images/${imageId}/`),
    createVariant: (productId: string, data: any) => 
      api.post(`/sellers/me/products/${productId}/variants/`, data),
    deleteVariant: (productId: string, variantId: string) => 
      api.delete(`/sellers/me/products/${productId}/variants/${variantId}/`),
  }
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
