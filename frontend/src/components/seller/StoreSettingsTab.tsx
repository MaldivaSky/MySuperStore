import { useState, useEffect } from "react";
import { Store, Eye, Save, Upload, Loader2, ImagePlus } from "lucide-react";
import { sellerApi, sellerDashboardApi } from "@/lib/api";
import { compressImage } from "@/lib/imageCompression";
import { useToast } from "@/components/ui/Toast";

export function StoreSettingsTab({ user, onUpdate }: { user: any; onUpdate: (data: any) => void }) {
  const { toast } = useToast();

  const [slug, setSlug] = useState<string>("");
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    logo: null, banner: null, banner2: null, banner3: null
  });

  const [previews, setPreviews] = useState<{ [key: string]: string }>({
    logo: "", banner: "", banner2: "", banner3: ""
  });

  // Carrega os dados atuais da loja para o form abrir já preenchido.
  useEffect(() => {
    let active = true;
    sellerApi.me()
      .then(({ data }) => {
        if (!active) return;
        setStoreName(data.store_name || "");
        setDescription(data.description || "");
        setSlug(data.slug || "");
        setPreviews({
          logo: data.logo_url || "",
          banner: data.banner_url || "",
          banner2: data.banner2_url || "",
          banner3: data.banner3_url || "",
        });
      })
      .catch(() => toast("Não foi possível carregar os dados da loja.", "error"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [toast]);

  const handleFileChange = async (field: string, original: File | undefined) => {
    if (!original) return;
    // Comprime no navegador (banners são largos: mantém 1920px de largura).
    const file = await compressImage(original, { maxDimension: 1920 });
    setFiles(prev => ({ ...prev, [field]: file }));
    setPreviews(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("store_name", storeName);
      fd.append("description", description);
      
      if (files.logo) fd.append("logo", files.logo);
      if (files.banner) fd.append("banner", files.banner);
      if (files.banner2) fd.append("banner2", files.banner2);
      if (files.banner3) fd.append("banner3", files.banner3);

      const { data } = await sellerDashboardApi.updateProfile(fd);
      onUpdate(data);
      toast("Configurações salvas com sucesso!", "success");
    } catch (err: any) {
      toast(err.response?.data?.detail || "Erro ao salvar configurações", "error");
    } finally {
      setSaving(false);
    }
  };

  const renderImageUpload = (field: string, label: string, aspect: string) => (
    <div className="space-y-2">
      <label className="text-xs text-neutral-400 uppercase tracking-wider font-bold block">{label}</label>
      <div className={`relative ${aspect} rounded-xl border-2 border-dashed border-white/20 bg-black/40 overflow-hidden group hover:border-[#E6B53C]/60 transition-colors`}>
        {previews[field] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previews[field]} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 group-hover:text-[#E6B53C]">
            <ImagePlus className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-semibold">Sem imagem</span>
          </div>
        )}
        <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
          <Upload className="w-6 h-6 text-white" />
          <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(field, e.target.files?.[0])} />
        </label>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Informações Básicas */}
        <div className="bg-[#0a0a14]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 flex flex-col">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Store className="w-5 h-5 text-blue-500" /> Perfil da Loja</h3>
          <div className="space-y-4 flex-grow">
            <div>
              <label className="text-xs text-neutral-400 uppercase tracking-wider font-bold block mb-1">Nome da Loja</label>
              <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} required className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-400 uppercase tracking-wider font-bold block mb-1">Descrição</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} required className="w-full bg-[#141420] border border-white/[0.05] rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none resize-none" rows={3}></textarea>
            </div>
            {renderImageUpload("logo", "Logo da Loja", "aspect-square w-32")}
          </div>
          <button type="submit" disabled={saving} className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Salvar Perfil
          </button>
        </div>

        {/* Premium Glassdoor */}
        <div className="bg-gradient-to-br from-[#0a0a14] to-[#E6B53C]/10 backdrop-blur-xl border border-[#E6B53C]/20 rounded-3xl p-8 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#E6B53C]/20 rounded-full blur-[50px]"></div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#E6B53C] relative z-10"><Store className="w-5 h-5" /> Banners da Vitrine</h3>
          <p className="text-sm text-neutral-300 mb-6 relative z-10">Personalize o visual da sua loja pública enviando até 3 banners rotativos (Ideal: 1920x600).</p>
          <div className="space-y-4 relative z-10 flex-grow">
            {renderImageUpload("banner", "Banner Principal", "aspect-[3/1] w-full")}
            <div className="grid grid-cols-2 gap-4">
              {renderImageUpload("banner2", "Banner 2 (Opcional)", "aspect-[3/1] w-full")}
              {renderImageUpload("banner3", "Banner 3 (Opcional)", "aspect-[3/1] w-full")}
            </div>
          </div>
          <a
            href={`/s/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-[#E6B53C] to-[#B38F25] text-black font-black py-3 rounded-xl hover:opacity-90 transition-opacity relative z-10"
          >
            <Eye className="w-5 h-5" /> Acessar Minha Vitrine
          </a>
        </div>
      </div>
    </form>
  );
}
