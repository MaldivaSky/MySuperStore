"use client";

import { useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { userApi } from "@/lib/api";

interface AddressFormProps {
  onSuccess?: () => void;
  initialData?: any;
}

export function AddressForm({ onSuccess, initialData }: AddressFormProps) {
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    label: initialData?.label || "Casa",
    recipient_name: initialData?.recipient_name || "",
    cep: initialData?.cep || "",
    logradouro: initialData?.logradouro || "",
    numero: initialData?.numero || "",
    complemento: initialData?.complemento || "",
    bairro: initialData?.bairro || "",
    cidade: initialData?.cidade || "",
    uf: initialData?.uf || "",
    reference_point: initialData?.reference_point || "",
    observation: initialData?.observation || "",
    is_default: initialData?.is_default || false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Apenas números, máximo 8 dígitos
    const val = e.target.value.replace(/\D/g, "").substring(0, 8);
    let formatted = val;
    if (val.length > 5) {
      formatted = `${val.substring(0, 5)}-${val.substring(5)}`;
    }
    setFormData((prev) => ({ ...prev, cep: formatted }));

    if (val.length === 8) {
      await fetchViaCEP(val);
    }
  };

  const fetchViaCEP = async (cep: string) => {
    setCepLoading(true);
    setError("");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setError("CEP não encontrado.");
      } else {
        setFormData((prev) => ({
          ...prev,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf,
        }));
      }
    } catch (err) {
      setError("Erro ao buscar o CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Remover máscara do CEP antes de enviar se necessário,
      // mas o backend model tem max_length=8. ViaCep retorna sem hífen.
      // Ops, nosso model tem max_length=8, então precisamos enviar só os números.
      const payload = {
        ...formData,
        cep: formData.cep.replace(/\D/g, ""),
      };

      if (initialData?.id) {
        await userApi.updateAddress(initialData.id, payload);
      } else {
        await userApi.createAddress(payload);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ocorreu um erro ao salvar o endereço.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome do Recebedor</label>
          <input
            name="recipient_name"
            required
            value={formData.recipient_name}
            onChange={handleChange}
            placeholder="Ex: João da Silva"
            className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Etiqueta (Opcional)</label>
          <input
            name="label"
            value={formData.label}
            onChange={handleChange}
            placeholder="Ex: Casa, Trabalho"
            className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CEP</label>
          <div className="relative">
            <input
              name="cep"
              required
              value={formData.cep}
              onChange={handleCepChange}
              placeholder="00000-000"
              className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {cepLoading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Search className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rua / Logradouro</label>
          <input
            name="logradouro"
            required
            value={formData.logradouro}
            onChange={handleChange}
            readOnly={!!formData.logradouro} // Impede edição se o ViaCEP preencheu
            className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all read-only:bg-muted/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Número</label>
          <input
            name="numero"
            required
            value={formData.numero}
            onChange={handleChange}
            placeholder="123"
            className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
          />
        </div>
        <div className="space-y-1 col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Complemento (Opcional)</label>
          <input
            name="complemento"
            value={formData.complemento}
            onChange={handleChange}
            placeholder="Apto 4B, Bloco 2"
            className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bairro</label>
          <input
            name="bairro"
            required
            value={formData.bairro}
            onChange={handleChange}
            readOnly={!!formData.bairro}
            className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all read-only:bg-muted/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cidade</label>
          <input
            name="cidade"
            required
            value={formData.cidade}
            onChange={handleChange}
            readOnly={!!formData.cidade}
            className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all read-only:bg-muted/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">UF</label>
          <input
            name="uf"
            required
            maxLength={2}
            value={formData.uf}
            onChange={handleChange}
            readOnly={!!formData.uf}
            className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground uppercase placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all read-only:bg-muted/50"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ponto de Referência (Opcional)</label>
        <input
          name="reference_point"
          value={formData.reference_point}
          onChange={handleChange}
          placeholder="Ex: Em frente à padaria principal"
          className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observação para Entrega (Opcional)</label>
        <textarea
          name="observation"
          value={formData.observation}
          onChange={handleChange}
          placeholder="Ex: Deixar na portaria com o seu João."
          rows={2}
          className="w-full px-4 py-2.5 rounded-lg border border-border/60 bg-background/50 text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all resize-none"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer pt-2">
        <input
          type="checkbox"
          name="is_default"
          checked={formData.is_default}
          onChange={(e) => setFormData((prev) => ({ ...prev, is_default: e.target.checked }))}
          className="w-4 h-4 rounded border-border accent-primary"
        />
        <span className="text-sm font-medium">Definir como endereço principal</span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-4 flex items-center justify-center gap-2 bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(230,181,60,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
        Salvar Endereço
      </button>
    </form>
  );
}
