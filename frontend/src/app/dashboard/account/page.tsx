"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi, usersApi } from "@/lib/api";
import {
  User, MapPin, Loader2, Save, Plus, Trash2, Edit2, Camera, Lock,
  Star, X, Check, ShieldCheck, Home, Briefcase, Building2, Search,
  Eye, EyeOff, ChevronRight, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";

interface Address {
  id: string;
  label: string;
  recipient_name: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  reference_point?: string;
  is_default: boolean;
}

const LABEL_OPTIONS = [
  { id: "Casa", icon: Home },
  { id: "Trabalho", icon: Briefcase },
  { id: "Outro", icon: Building2 },
];

type Tab = "perfil" | "enderecos" | "seguranca";

export default function AccountPage() {
  const { user, updateUser } = useAuthStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("perfil");

  // ── Perfil ────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ first_name: "", last_name: "", phone: "" });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Endereços ─────────────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [addrModal, setAddrModal] = useState<(Omit<Address, "id"> & { id?: string }) | null>(null);
  const [savingAddr, setSavingAddr] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // CEP state inside modal
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [cepReady, setCepReady] = useState(false);

  // ── Senha ─────────────────────────────────────────────────────────────────
  const [pwd, setPwd] = useState({ old_password: "", new_password: "", new_password_confirm: "" });
  const [savingPwd, setSavingPwd] = useState(false);
  const [showPwd, setShowPwd] = useState({ old: false, new: false, confirm: false });

  useEffect(() => {
    if (user) {
      setProfile({ first_name: user.first_name || "", last_name: user.last_name || "", phone: user.phone || "" });
      setAvatarPreview(user.avatar_url || (user as any)?.avatar || null);
    }
    loadAddresses();
  }, [user]);

  const loadAddresses = async () => {
    setLoadingAddr(true);
    try {
      const res = await usersApi.addresses();
      setAddresses(res.data.results || res.data);
    } catch { /* silencioso */ } finally {
      setLoadingAddr(false);
    }
  };

  // ── Perfil handlers ───────────────────────────────────────────────────────
  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      let payload: any;
      if (avatarFile) {
        payload = new FormData();
        payload.append("first_name", profile.first_name);
        payload.append("last_name", profile.last_name);
        if (profile.phone) payload.append("phone", profile.phone);
        payload.append("avatar", avatarFile);
      } else {
        payload = { first_name: profile.first_name, last_name: profile.last_name, phone: profile.phone || null };
      }
      const res = await authApi.updateProfile(payload);
      updateUser(res.data);
      setAvatarFile(null);
      toast("Perfil atualizado com sucesso!", "success");
    } catch (err: any) {
      toast(err?.response?.data?.phone?.[0] || err?.response?.data?.detail || "Erro ao salvar o perfil.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Endereço handlers ────────────────────────────────────────────────────
  const openNewAddress = () => {
    setCepError("");
    setCepReady(false);
    setAddrModal({
      label: "Casa",
      recipient_name: `${profile.first_name} ${profile.last_name}`.trim(),
      cep: "", logradouro: "", numero: "", complemento: "",
      bairro: "", cidade: "", uf: "", reference_point: "", is_default: false,
    });
  };

  const openEditAddress = (addr: Address) => {
    setCepError("");
    setCepReady(!!(addr.logradouro && addr.bairro));
    setAddrModal({ ...addr });
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").substring(0, 8);
    const fmt = raw.length > 5 ? `${raw.substring(0, 5)}-${raw.substring(5)}` : raw;
    setAddrModal(prev => prev ? { ...prev, cep: fmt, logradouro: "", bairro: "", cidade: "", uf: "" } : null);
    setCepError("");
    setCepReady(false);
    if (raw.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await res.json();
        if (data.erro) {
          setCepError("CEP não encontrado.");
        } else {
          setAddrModal(prev => prev ? ({
            ...prev,
            logradouro: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            uf: data.uf || "",
          }) : null);
          setCepReady(true);
        }
      } catch {
        setCepError("Erro ao buscar CEP.");
      } finally {
        setCepLoading(false);
      }
    }
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrModal) return;
    setSavingAddr(true);
    try {
      const { id, ...data } = addrModal;
      data.cep = data.cep.replace(/\D/g, "");
      if (id) await usersApi.updateAddress(id, data);
      else await usersApi.createAddress(data);
      setAddrModal(null);
      await loadAddresses();
      toast(id ? "Endereço atualizado!" : "Endereço adicionado!", "success");
    } catch (err: any) {
      toast(err?.response?.data?.detail || "Erro ao salvar endereço.", "error");
    } finally {
      setSavingAddr(false);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      await usersApi.deleteAddress(id);
      setDeleteConfirm(null);
      await loadAddresses();
      toast("Endereço removido.", "success");
    } catch {
      toast("Erro ao remover endereço.", "error");
    }
  };

  const setDefault = async (addr: Address) => {
    try {
      await usersApi.updateAddress(addr.id, { is_default: true });
      await loadAddresses();
      toast(`"${addr.label}" definido como padrão.`, "success");
    } catch { /* silencioso */ }
  };

  // ── Senha handlers ───────────────────────────────────────────────────────
  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.new_password !== pwd.new_password_confirm) {
      toast("As senhas não conferem.", "error");
      return;
    }
    setSavingPwd(true);
    try {
      await authApi.changePassword(pwd);
      setPwd({ old_password: "", new_password: "", new_password_confirm: "" });
      toast("Senha alterada com sucesso!", "success");
    } catch (err: any) {
      const d = err?.response?.data;
      const text = d?.old_password?.[0] || d?.new_password?.[0] || d?.non_field_errors?.[0] || "Erro ao alterar senha.";
      toast(text, "error");
    } finally {
      setSavingPwd(false);
    }
  };

  const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase();

  const TABS: { id: Tab; label: string; icon: any }[] = [
    { id: "perfil", label: "Perfil", icon: User },
    { id: "enderecos", label: "Endereços", icon: MapPin },
    { id: "seguranca", label: "Segurança", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* ── Overview card ── */}
      <div className="flex items-center gap-4 p-5 rounded-2xl border border-border/40 bg-card/40">
        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/40 bg-secondary/40 flex items-center justify-center shrink-0">
          {avatarPreview
            ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            : <span className="text-xl font-display font-bold text-primary">{initials || <User className="h-7 w-7" />}</span>
          }
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-display font-bold truncate">{user?.first_name} {user?.last_name}</h1>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {addresses.find(a => a.is_default)
              ? `📍 ${addresses.find(a => a.is_default)?.cidade}/${addresses.find(a => a.is_default)?.uf}`
              : "📍 Sem endereço padrão"
            }
          </p>
        </div>
      </div>

      {/* ── Sub-tabs ── */}
      <div className="flex gap-1 bg-card/40 border border-border/40 rounded-2xl p-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >

          {/* ═══════════ PERFIL ═══════════ */}
          {activeTab === "perfil" && (
            <div className="p-6 rounded-2xl border border-border/40 bg-card/40 space-y-6">
              <h2 className="text-lg font-bold">Dados Pessoais</h2>

              <div className="flex flex-col sm:flex-row gap-6">
                {/* Avatar picker */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30 bg-secondary/40 flex items-center justify-center">
                    {avatarPreview
                      ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      : <span className="text-2xl font-display font-bold text-primary">{initials || <User className="h-8 w-8" />}</span>
                    }
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="absolute bottom-0 inset-x-0 bg-black/65 text-white py-1.5 flex items-center justify-center gap-1 text-[10px] font-semibold hover:bg-black/80 transition-colors"
                    >
                      <Camera className="h-3 w-3" /> Trocar
                    </button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={onPickAvatar} className="hidden" />
                </div>

                {/* Form */}
                <form onSubmit={saveProfile} className="flex-grow space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">E-mail</label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-muted/30 text-muted-foreground cursor-not-allowed text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AccountField label="Nome" value={profile.first_name} onChange={v => setProfile({ ...profile, first_name: v })} required />
                    <AccountField label="Sobrenome" value={profile.last_name} onChange={v => setProfile({ ...profile, last_name: v })} required />
                  </div>
                  <AccountField label="Telefone" value={profile.phone} onChange={v => setProfile({ ...profile, phone: v })} placeholder="(11) 90000-0000" />
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all shadow-md disabled:opacity-50"
                  >
                    {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {savingProfile ? "Salvando..." : "Salvar Perfil"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ═══════════ ENDEREÇOS ═══════════ */}
          {activeTab === "enderecos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Meus Endereços
                </h2>
                <button
                  onClick={openNewAddress}
                  className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-xl"
                >
                  <Plus className="h-4 w-4" /> Novo
                </button>
              </div>

              {loadingAddr ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : addresses.length === 0 ? (
                <button
                  onClick={openNewAddress}
                  className="w-full flex flex-col items-center gap-3 py-12 rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                >
                  <MapPin className="h-10 w-10 opacity-30" />
                  <span className="font-semibold text-sm">Adicione seu primeiro endereço</span>
                </button>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        addr.is_default
                          ? "border-primary/50 bg-primary/5 shadow-[0_0_12px_rgba(var(--primary),0.1)]"
                          : "border-border/40 bg-card/40 hover:border-border/70"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{addr.label}</span>
                          {addr.is_default && (
                            <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">
                              Padrão
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEditAddress(addr)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(addr.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-medium">{addr.recipient_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{addr.logradouro}, {addr.numero}{addr.complemento ? ` — ${addr.complemento}` : ""}</p>
                      <p className="text-xs text-muted-foreground">{addr.bairro} · {addr.cidade}/{addr.uf}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">CEP {addr.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}</p>
                      {!addr.is_default && (
                        <button
                          onClick={() => setDefault(addr)}
                          className="mt-3 text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          <Star className="h-3 w-3" /> Definir como padrão
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════ SEGURANÇA ═══════════ */}
          {activeTab === "seguranca" && (
            <div className="p-6 rounded-2xl border border-border/40 bg-card/40 space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Segurança da Conta
              </h2>

              <form onSubmit={savePassword} className="space-y-4 max-w-md">
                <PwdField
                  label="Senha atual"
                  value={pwd.old_password}
                  show={showPwd.old}
                  onToggle={() => setShowPwd(p => ({ ...p, old: !p.old }))}
                  onChange={v => setPwd({ ...pwd, old_password: v })}
                />
                <PwdField
                  label="Nova senha"
                  value={pwd.new_password}
                  show={showPwd.new}
                  onToggle={() => setShowPwd(p => ({ ...p, new: !p.new }))}
                  onChange={v => setPwd({ ...pwd, new_password: v })}
                />
                <PwdField
                  label="Confirmar nova senha"
                  value={pwd.new_password_confirm}
                  show={showPwd.confirm}
                  onToggle={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))}
                  onChange={v => setPwd({ ...pwd, new_password_confirm: v })}
                />
                <button
                  type="submit"
                  disabled={savingPwd || !pwd.old_password || !pwd.new_password || !pwd.new_password_confirm}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all shadow-md disabled:opacity-50 w-full sm:w-auto"
                >
                  {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Alterar Senha
                </button>
              </form>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ── Address Modal ── */}
      <AnimatePresence>
        {addrModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddrModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="relative w-full sm:max-w-md bg-[#0e0e1a] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[95vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-[#0e0e1a] z-10">
                <div>
                  <h3 className="font-bold text-base">{addrModal.id ? "Editar Endereço" : "Novo Endereço"}</h3>
                  <p className="text-xs text-muted-foreground">Digite o CEP para preenchimento automático</p>
                </div>
                <button onClick={() => setAddrModal(null)} className="p-1.5 rounded-full hover:bg-white/10 text-muted-foreground transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={saveAddress} className="p-5 space-y-4">
                {/* Label chips */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Este endereço é...</p>
                  <div className="flex gap-2">
                    {LABEL_OPTIONS.map(opt => {
                      const Icon = opt.icon;
                      const active = addrModal.label === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setAddrModal(prev => prev ? { ...prev, label: opt.id } : null)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                            active ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20"
                          }`}
                        >
                          <Icon className="w-4 h-4" />{opt.id}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recipient */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Destinatário</label>
                  <input
                    value={addrModal.recipient_name}
                    onChange={e => setAddrModal(prev => prev ? { ...prev, recipient_name: e.target.value } : null)}
                    placeholder="Nome de quem vai receber"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-foreground placeholder-neutral-600 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                  />
                </div>

                {/* CEP */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CEP</label>
                  <div className="relative">
                    <input
                      value={addrModal.cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      maxLength={9}
                      required
                      className={`w-full pl-4 pr-12 py-3.5 rounded-xl border font-mono font-medium text-lg outline-none transition-all ${
                        cepError
                          ? "border-red-500/50 bg-red-500/5"
                          : cepReady
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : "border-white/10 bg-white/5"
                      } text-foreground placeholder-neutral-600 focus:border-primary focus:ring-1 focus:ring-primary/30`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {cepLoading
                        ? <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        : cepReady
                        ? <Check className="w-5 h-5 text-emerald-500" />
                        : <Search className="w-5 h-5 text-muted-foreground" />
                      }
                    </div>
                  </div>
                  {cepError && <p className="text-xs text-red-400 font-medium">{cepError}</p>}
                </div>

                {/* Auto-filled address display */}
                {cepReady && addrModal.logradouro && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3"
                  >
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Endereço encontrado ✓</p>
                    <p className="text-sm font-semibold">{addrModal.logradouro}</p>
                    <p className="text-xs text-muted-foreground">{addrModal.bairro} · {addrModal.cidade}/{addrModal.uf}</p>
                  </motion.div>
                )}

                {/* Number + Complement */}
                {cepReady && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Número <span className="text-red-400">*</span></label>
                      <input
                        value={addrModal.numero}
                        onChange={e => setAddrModal(prev => prev ? { ...prev, numero: e.target.value } : null)}
                        placeholder="123"
                        required
                        autoFocus
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-foreground placeholder-neutral-600 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Complemento</label>
                      <input
                        value={addrModal.complemento}
                        onChange={e => setAddrModal(prev => prev ? { ...prev, complemento: e.target.value } : null)}
                        placeholder="Apto, Bloco..."
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-foreground placeholder-neutral-600 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                      />
                    </div>
                  </motion.div>
                )}

                {cepReady && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ponto de Referência</label>
                    <input
                      value={addrModal.reference_point || ""}
                      onChange={e => setAddrModal(prev => prev ? { ...prev, reference_point: e.target.value } : null)}
                      placeholder="Ex: Em frente à padaria, portão azul..."
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-foreground placeholder-neutral-600 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                    />
                  </motion.div>
                )}

                {/* Default checkbox */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addrModal.is_default}
                    onChange={e => setAddrModal(prev => prev ? { ...prev, is_default: e.target.checked } : null)}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm text-muted-foreground">Definir como endereço padrão</span>
                </label>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setAddrModal(null)}
                    className="flex-1 py-3 rounded-xl font-semibold text-muted-foreground hover:bg-white/5 border border-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddr || !addrModal.recipient_name || (!cepReady && !addrModal.logradouro) || !addrModal.numero}
                    className="flex-1 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {savingAddr ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0e0e1a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl z-10 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-bold text-lg mb-2">Remover endereço?</h3>
              <p className="text-sm text-muted-foreground mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl font-semibold border border-white/10 text-muted-foreground hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteAddress(deleteConfirm)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-destructive text-white hover:bg-destructive/90 transition-all"
                >
                  Remover
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Helper components ─────────────────────────────────────────────────────── */
function AccountField({
  label, value, onChange, ...props
}: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        {...props}
        className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background focus:border-primary outline-none transition-colors text-sm"
      />
    </div>
  );
}

function PwdField({
  label, value, show, onToggle, onChange,
}: {
  label: string; value: string; show: boolean;
  onToggle: () => void; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          className="w-full px-4 pr-11 py-2.5 rounded-lg border border-border/60 bg-background focus:border-primary outline-none transition-colors text-sm"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
