"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";
import { User, MapPin, Loader2, Save, Plus, Trash2, Edit2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AccountPage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
  });

  // Mock addresses since backend doesn't have address endpoint yet
  const [addresses, setAddresses] = useState([
    { id: 1, title: "Casa", address: "Rua Fictícia, 123", city: "São Paulo", cep: "01000-000", isDefault: true }
  ]);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await authApi.updateProfile(formData);
      updateUser(res.data);
      setMessage("Perfil atualizado com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage("Erro ao atualizar o perfil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2">
        <User className="h-6 w-6 text-primary" /> Minha Conta
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* DADOS PESSOAIS */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border border-border/40 bg-card/40 space-y-6"
        >
          <h2 className="text-lg font-bold border-b border-border/40 pb-4">Dados Pessoais</h2>
          
          {message && (
            <div className={`p-3 rounded-lg text-sm font-medium border ${
              message.includes("sucesso") ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">E-mail</label>
              <input 
                type="email" 
                value={user?.email || ""} 
                disabled 
                className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-muted/30 text-muted-foreground cursor-not-allowed" 
              />
              <p className="text-[10px] text-muted-foreground mt-1">O e-mail não pode ser alterado.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Nome</label>
                <input 
                  type="text" 
                  value={formData.first_name} 
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background focus:border-primary outline-none transition-colors" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Sobrenome</label>
                <input 
                  type="text" 
                  value={formData.last_name} 
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background focus:border-primary outline-none transition-colors" 
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all shadow-md disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {loading ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </motion.div>

        {/* ENDEREÇOS */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl border border-border/40 bg-card/40 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <h2 className="text-lg font-bold">Endereços de Entrega</h2>
            <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
              <Plus className="h-4 w-4" /> Novo
            </button>
          </div>

          <div className="space-y-4">
            {addresses.map(addr => (
              <div key={addr.id} className={`p-4 rounded-xl border ${addr.isDefault ? "border-primary bg-primary/5" : "border-border/40 bg-background/50"}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">{addr.title}</span>
                    {addr.isDefault && <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">Padrão</span>}
                  </div>
                  <div className="flex gap-2">
                    <button className="text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="h-4 w-4" /></button>
                    <button className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{addr.address}</p>
                <p className="text-sm text-muted-foreground">{addr.city} - {addr.cep}</p>
              </div>
            ))}
          </div>

        </motion.div>

      </div>
    </div>
  );
}
