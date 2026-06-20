import { create } from "zustand";
import { cartApi } from "@/lib/api";

interface CartState {
  itemCount: number;
  loading: boolean;
  fetchCartCount: () => Promise<void>;
  setItemCount: (count: number) => void;
}

export const useCartStore = create<CartState>((set) => ({
  itemCount: 0,
  loading: false,
  fetchCartCount: async () => {
    set({ loading: true });
    try {
      const res = await cartApi.get();
      set({ itemCount: res.data.items.length });
    } catch (err) {
      set({ itemCount: 0 });
    } finally {
      set({ loading: false });
    }
  },
  setItemCount: (count: number) => set({ itemCount: count }),
}));
