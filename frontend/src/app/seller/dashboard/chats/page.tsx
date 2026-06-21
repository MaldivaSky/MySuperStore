"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { chatApi } from "@/lib/api";
import { Header } from "@/components/Header";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  ArrowLeft,
  User,
  Clock
} from "lucide-react";

export default function SellerChatsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carrega as salas de chat
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    chatApi.listRooms()
      .then((res) => {
        setRooms(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingRooms(false));
  }, [isAuthenticated, router]);

  // Rola para o fim da tela ao receber mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket URL dinâmica baseada no activeRoom
  const socketUrl = activeRoom && typeof window !== "undefined"
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host.includes('3000') ? 'localhost:8000' : window.location.host}/ws/chat/${activeRoom.id}/?token=${localStorage.getItem('access_token')}`
    : null;

  const { sendMessage: sendWsMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    shouldReconnect: (closeEvent) => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });

  // Atualiza as mensagens quando clica numa sala
  const handleSelectRoom = (room: any) => {
    setActiveRoom(room);
    setMessages(room.messages || []);
  };

  // Escuta novas mensagens do WebSocket
  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      if (data.type === "chat_message") {
        setMessages((prev) => [...prev, data]);
        // Atualiza a ultima mensagem na lista de salas
        setRooms((prevRooms) => prevRooms.map(r => {
          if (r.id === activeRoom?.id) {
            return { ...r, messages: [...(r.messages || []), data] };
          }
          return r;
        }));
      }
    }
  }, [lastMessage, activeRoom]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || readyState !== ReadyState.OPEN) return;
    
    sendWsMessage(JSON.stringify({ message: newMessage }));
    setNewMessage("");
  };

  if (loadingRooms) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-80px)]">
        
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => router.push("/seller/dashboard")}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
          </button>
          <h1 className="text-2xl font-display font-black flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-blue-500" />
            Central de Mensagens
          </h1>
        </div>

        <div className="flex-grow flex bg-card border border-border rounded-2xl overflow-hidden shadow-sm h-[600px]">
          
          {/* PAINEL ESQUERDO: LISTA DE SALAS */}
          <div className="w-1/3 border-r border-border flex flex-col bg-background/50">
            <div className="p-4 border-b border-border bg-card">
              <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Suas Conversas</h2>
            </div>
            <div className="overflow-y-auto flex-grow">
              {rooms.length > 0 ? rooms.map((room) => {
                const lastMsg = room.messages?.length ? room.messages[room.messages.length - 1] : null;
                const isActive = activeRoom?.id === room.id;
                
                return (
                  <button
                    key={room.id}
                    onClick={() => handleSelectRoom(room)}
                    className={`w-full text-left p-4 border-b border-border/50 hover:bg-muted/50 transition-colors flex gap-3 ${isActive ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-grow overflow-hidden">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-sm truncate">{room.customer_name || 'Comprador'}</span>
                        {lastMsg && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(lastMsg.created_at).toLocaleDateString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {lastMsg ? lastMsg.message : "Nenhuma mensagem."}
                      </p>
                    </div>
                  </button>
                );
              }) : (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  Nenhuma conversa iniciada.
                </div>
              )}
            </div>
          </div>

          {/* PAINEL DIREITO: CHAT ABERTO */}
          <div className="flex-grow flex flex-col bg-muted/10 relative">
            {activeRoom ? (
              <>
                {/* Header do Chat Aberto */}
                <div className="p-4 bg-card border-b border-border flex justify-between items-center z-10 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">{activeRoom.customer_name || 'Comprador'}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {readyState === ReadyState.OPEN ? (
                          <><span className="w-2 h-2 rounded-full bg-green-500"></span> Online (Real-Time)</>
                        ) : (
                          <><span className="w-2 h-2 rounded-full bg-amber-500"></span> Conectando...</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Área de Mensagens */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#f0f2f5] dark:bg-background/90">
                  {messages.length > 0 ? (
                    messages.map((msg: any, idx: number) => {
                      const isMe = msg.sender_id === String(user?.id);
                      return (
                        <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm relative ${
                            isMe 
                              ? 'bg-primary text-primary-foreground rounded-tr-none' 
                              : 'bg-card text-foreground rounded-tl-none border border-border'
                          }`}>
                            <p className="text-sm">{msg.message}</p>
                            <span className={`text-[10px] mt-1 block text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                      <MessageCircle className="h-12 w-12 mb-2" />
                      <p className="text-sm">Envie a primeira mensagem.</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Form de Envio */}
                <form onSubmit={handleSendMessage} className="p-4 bg-card border-t border-border flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-grow px-4 py-3 rounded-full border border-border bg-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || readyState !== ReadyState.OPEN}
                    className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-5 w-5 ml-1" />
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-xl font-bold mb-2">Central de Mensagens</h3>
                <p className="text-sm">Selecione uma conversa na lateral esquerda para iniciar.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
