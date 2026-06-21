import { create } from "zustand";
import { userApi } from "@/lib/api";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  related_entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  wsConnected: boolean;
  wsSocket: WebSocket | null;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  connectWebSocket: (token: string) => void;
  disconnectWebSocket: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  wsConnected: false,
  wsSocket: null,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      // Usando uma chamada de API normal para pegar as iniciais
      const response = await userApi.getNotifications();
      const notifications = response.data;
      const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;
      
      set({ notifications, unreadCount, loading: false });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      set({ loading: false });
    }
  },

  markAllAsRead: async () => {
    try {
      await userApi.markAllNotificationsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  },

  connectWebSocket: (token: string) => {
    if (get().wsConnected || get().wsSocket) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws/notifications/?token=${token}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("Notification WebSocket connected");
      set({ wsConnected: true, wsSocket: socket });
      get().fetchNotifications(); // Fetch initial state on connect
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Recebeu notificação
        const notif: Notification = data;
        
        set((state) => {
          // Evita duplicatas se o websocket mandar repetido
          if (state.notifications.some(n => n.id === notif.id)) {
            return state;
          }
          
          return {
            notifications: [notif, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          };
        });
      } catch (err) {
        console.error("Error parsing notification WS message:", err);
      }
    };

    socket.onclose = () => {
      console.log("Notification WebSocket disconnected");
      set({ wsConnected: false, wsSocket: null });
      // Tenta reconectar em 5 segundos
      setTimeout(() => {
        const currentToken = localStorage.getItem("token"); // or from authStore
        if (currentToken) get().connectWebSocket(currentToken);
      }, 5000);
    };

    socket.onerror = (err) => {
      console.error("Notification WebSocket error:", err);
    };
  },

  disconnectWebSocket: () => {
    const socket = get().wsSocket;
    if (socket) {
      socket.close();
      set({ wsConnected: false, wsSocket: null });
    }
  },
}));
