"use client";

export const dynamic = "force-dynamic";


import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi, usersApi } from "@/lib/api";
import {
  User, MapPin, Loader2, Save, Plus, Trash2, Edit2, Camera, Lock,
  Star, X, Check, ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const emptyAddress: Omit<Address, "id"> = {
  label: "Casa", recipient_name: "", cep: "", logradouro: "", numero: "",
  complemento: "", bairro: "", cidade: "", uf: "", reference_point: "", is_default: false,
};

export default function AccountPage() {
  const { user, updateUser } = useAuthStore();

  // ── Perfil ──────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ first_name: "", last_name: "", phone: "" });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Dados demográficos (survey) ──────────────────────────────────────────────
  const [survey, setSurvey] = useState({
    date_of_birth: "", gender: "", profession: "", education_level: "", marital_status: "",
  });
  const [savingSurvey, setSavingSurvey] = useState(false);
  const [surveyMsg, setSurveyMsg] = useState("");

  // ── Endereços ─────────────────────────────────────────────────────────────────
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [editing, setEditing] = useState<(Omit<Address, "id"> & { id?: string }) | null>(null);
  const [savingAddr, setSavingAddr] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  // ── Senha ─────────────────────────────────────────────────────────────────────
  const [pwd, setPwd] = useState({ old_password: "", new_password: "", new_password_confirm: "" });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setProfile({ first_name: user.first_name || "", last_name: user.last_name || "", phone: user.phone || "" });
      setAvatarPreview(user.avatar_url || (user as any)?.avatar || null);
    }
    usersApi.survey().then((res) => {
      const s = res.data;
      setSurvey({
        date_of_birth: s.date_of_birth || "", gender: s.gender || "", profession: s.profession || "",
        education_level: s.education_level || "", marital_status: s.marital_status || "",
      });
    }).catch(() => {});
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

  // ── Handlers de perfil ────────────────────────────────────────────────────────
  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
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
      setProfileMsg("Perfil atualizado com sucesso!");
      setTimeout(() => setProfileMsg(""), 3000);
    } catch (err: any) {
      setProfileMsg(err?.response?.data?.phone?.[0] || err?.response?.data?.detail || "Erro ao salvar o perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSurvey(true);
    setSurveyMsg("");
    try {
      const payload = Object.fromEntries(Object.entries(survey).filter(([, v]) => v !== ""));
      await usersApi.saveSurvey(payload);
      setSurveyMsg("Dados salvos!");
      setTimeout(() => setSurveyMsg(""), 3000);
    } catch {
      setSurveyMsg("Erro ao salvar.");
    } finally {
      setSavingSurvey(false);
    }
  };

  // ── Handlers de endereço ──────────────────────────────────────────────────────
  const lookupCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8 || !editing) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setEditing((prev) => prev && ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          uf: data.uf || prev.uf,
        }));
      }
    } catch { /* silencioso */ } finally {
      setCepLoading(false);
    }
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSavingAddr(true);
    try {
      const { id, ...data } = editing;
      data.cep = data.cep.replace(/\D/g, "");
      if (id) await usersApi.updateAddress(id, data);
      else await usersApi.createAddress(data);
      setEditing(null);
      await loadAddresses();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Erro ao salvar endereço. Verifique os campos.");
    } finally {
      setSavingAddr(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm("Remover este endereço?")) return;
    try {
      await usersApi.deleteAddress(id);
      await loadAddresses();
    } catch {
      alert("Erro ao remover endereço.");
    }
  };

  const setDefault = async (addr: Address) => {
    try {
      await usersApi.updateAddress(addr.id, { is_default: true });
      await loadAddresses();
    } catch { /* silencioso */ }
  };

  // ── Senha ─────────────────────────────────────────────────────────────────────
  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPwd(true);
    setPwdMsg(null);
    try {
      await authApi.changePassword(pwd);
      setPwd({ old_password: "", new_password: "", new_password_confirm: "" });
      setPwdMsg({ ok: true, text: "Senha alterada com sucesso!" });
    } catch (err: any) {
      const d = err?.response?.data;
      const text = d?.old_password?.[0] || d?.new_password?.[0] || d?.new_password_confirm?.[0] || "Erro ao alterar senha.";
      setPwdMsg({ ok: false, text });
    } finally {
      setSavingPwd(false);
    }
  };

  const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2">
        <User className="h-6 w-6 text-primary" /> Minha Conta
      </h1>

      {/* ── PERFIL + AVATAR ──────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl border border-border/40 bg-card/40 space-y-6">
        <h2 className="text-lg font-bold border-b border-border/40 pb-4">Dados Pessoais</h2>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-primary/30 bg-secondary/40 flex items-center justify-center">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-display font-bold text-primary">{initials || <User className="h-10 w-10" />}</span>
              )}
              <button type="button" onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 inset-x-0 bg-black/60 text-white py-1.5 flex items-center justify-center gap-1 text-[10px] font-semibold hover:bg-black/80 transition-colors">
                <Camera className="h-3 w-3" /> Trocar
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickAvatar} className="hidden" />
          </div>

          {/* Form */}
          <form onSubmit={saveProfile} className="flex-grow space-y-4">
            {profileMsg && (
              <div className={`p-3 rounded-lg text-sm font-medium border ${profileMsg.includes("sucesso") ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                {profileMsg}
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">E-mail</label>
              <input type="email" value={user?.email || ""} disabled
                className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-muted/30 text-muted-foreground cursor-not-allowed" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nome" value={profile.first_name} onChange={(v) => setProfile({ ...profile, first_name: v })} required />
              <Field label="Sobrenome" value={profile.last_name} onChange={(v) => setProfile({ ...profile, last_name: v })} required />
            </div>
            <Field label="Telefone" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} placeholder="(11) 90000-0000" />
            <button type="submit" disabled={savingProfile}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all shadow-md disabled:opacity-50">
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {savingProfile ? "Salvando..." : "Salvar Perfil"}
            </button>
          </form>
        </div>
      </motion.div>

      {/* ── DADOS DEMOGRÁFICOS ───────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="p-6 rounded-2xl border border-border/40 bg-card/40 space-y-6">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <h2 className="text-lg font-bold">Sobre Você</h2>
          {surveyMsg && <span className="text-xs font-semibold text-green-600">{surveyMsg}</span>}
        </div>
        <form onSubmit={saveSurvey} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Nascimento</label>
            <input type="date" value={survey.date_of_birth} onChange={(e) => setSurvey({ ...survey, date_of_birth: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background focus:border-primary outline-none" />
          </div>
          <Select label="Gênero" value={survey.gender} onChange={(v) => setSurvey({ ...survey, gender: v })}
            options={["", "Feminino", "Masculino", "Outro", "Prefiro não informar"]} />
          <Select label="Estado civil" value={survey.marital_status} onChange={(v) => setSurvey({ ...survey, marital_status: v })}
            options={["", "Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)"]} />
          <Field label="Profissão" value={survey.profession} onChange={(v) => setSurvey({ ...survey, profession: v })} />
          <Select label="Escolaridade" value={survey.education_level} onChange={(v) => setSurvey({ ...survey, education_level: v })}
            options={["", "Fundamental", "Médio", "Superior", "Pós-graduação"]} />
          <div className="flex items-end">
            <button type="submit" disabled={savingSurvey}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-bold hover:bg-secondary/70 transition-all w-full disabled:opacity-50">
              {savingSurvey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </button>
          </div>
        </form>
      </motion.div>

      {/* ── ENDEREÇOS ────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="p-6 rounded-2xl border border-border/40 bg-card/40 space-y-6">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Meus Endereços</h2>
          <button onClick={() => setEditing({ ...emptyAddress, recipient_name: `${profile.first_name} ${profile.last_name}`.trim() })}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
            <Plus className="h-4 w-4" /> Novo endereço
          </button>
        </div>

        {loadingAddr ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Você ainda não cadastrou endereços.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div key={addr.id} className={`p-4 rounded-xl border ${addr.is_default ? "border-primary bg-primary/5" : "border-border/40 bg-background/50"}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{addr.label}</span>
                    {addr.is_default && <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">Padrão</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(addr)} className="text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => deleteAddress(addr.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{addr.logradouro}, {addr.numero} {addr.complemento && `- ${addr.complemento}`}</p>
                <p className="text-sm text-muted-foreground">{addr.bairro} · {addr.cidade}/{addr.uf} · {addr.cep}</p>
                {!addr.is_default && (
                  <button onClick={() => setDefault(addr)} className="mt-2 text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    <Star className="h-3 w-3" /> Definir como padrão
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── SEGURANÇA ────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="p-6 rounded-2xl border border-border/40 bg-card/40 space-y-6">
        <h2 className="text-lg font-bold border-b border-border/40 pb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Segurança</h2>
        <form onSubmit={savePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <PwdField label="Senha atual" value={pwd.old_password} onChange={(v) => setPwd({ ...pwd, old_password: v })} />
          <PwdField label="Nova senha" value={pwd.new_password} onChange={(v) => setPwd({ ...pwd, new_password: v })} />
          <PwdField label="Confirmar nova" value={pwd.new_password_confirm} onChange={(v) => setPwd({ ...pwd, new_password_confirm: v })} />
          {pwdMsg && (
            <div className={`sm:col-span-3 p-3 rounded-lg text-sm font-medium border ${pwdMsg.ok ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
              {pwdMsg.text}
            </div>
          )}
          <div className="sm:col-span-3">
            <button type="submit" disabled={savingPwd}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all shadow-md disabled:opacity-50">
              {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Alterar senha
            </button>
          </div>
        </form>
      </motion.div>

      {/* ── MODAL DE ENDEREÇO ────────────────────────────────────────── */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditing(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-card rounded-2xl p-6 shadow-2xl border border-border/50 z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{editing.id ? "Editar endereço" : "Novo endereço"}</h3>
                <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={saveAddress} className="grid grid-cols-2 gap-3">
                <ModalField className="col-span-2" label="Apelido (ex: Casa, Trabalho)" value={editing.label} onChange={(v) => setEditing({ ...editing, label: v })} required />
                <ModalField className="col-span-2" label="Destinatário" value={editing.recipient_name} onChange={(v) => setEditing({ ...editing, recipient_name: v })} required />
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">CEP</label>
                  <div className="relative">
                    <input value={editing.cep} required maxLength={9}
                      onChange={(e) => setEditing({ ...editing, cep: e.target.value })}
                      onBlur={(e) => lookupCep(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background focus:border-primary outline-none" />
                    {cepLoading && <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3 text-primary" />}
                  </div>
                </div>
                <ModalField label="Número" value={editing.numero} onChange={(v) => setEditing({ ...editing, numero: v })} required />
                <ModalField className="col-span-2" label="Logradouro" value={editing.logradouro} onChange={(v) => setEditing({ ...editing, logradouro: v })} required />
                <ModalField label="Bairro" value={editing.bairro} onChange={(v) => setEditing({ ...editing, bairro: v })} required />
                <ModalField label="Complemento" value={editing.complemento} onChange={(v) => setEditing({ ...editing, complemento: v })} />
                <ModalField label="Cidade" value={editing.cidade} onChange={(v) => setEditing({ ...editing, cidade: v })} required />
                <ModalField label="UF" value={editing.uf} onChange={(v) => setEditing({ ...editing, uf: v.toUpperCase() })} required maxLength={2} />
                <label className="col-span-2 flex items-center gap-2 text-sm font-medium mt-1 cursor-pointer">
                  <input type="checkbox" checked={editing.is_default} onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })} className="accent-primary w-4 h-4" />
                  Definir como endereço padrão
                </label>
                <div className="col-span-2 flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-secondary/50 transition-colors">Cancelar</button>
                  <button type="submit" disabled={savingAddr} className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg hover:bg-primary/95 transition-all flex items-center gap-2 disabled:opacity-50">
                    {savingAddr ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Campos auxiliares ──────────────────────────────────────────────────────── */
function Field({ label, value, onChange, ...props }: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} {...props}
        className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background focus:border-primary outline-none transition-colors" />
    </div>
  );
}

function ModalField({ label, value, onChange, className = "", ...props }: { label: string; value: string; onChange: (v: string) => void; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs font-semibold text-muted-foreground uppercase">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} {...props}
        className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background focus:border-primary outline-none transition-colors" />
    </div>
  );
}

function PwdField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase">{label}</label>
      <input type="password" value={value} onChange={(e) => onChange(e.target.value)} required
        className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background focus:border-primary outline-none transition-colors" />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground uppercase">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background focus:border-primary outline-none transition-colors">
        {options.map((o) => <option key={o} value={o}>{o || "Selecione..."}</option>)}
      </select>
    </div>
  );
}
