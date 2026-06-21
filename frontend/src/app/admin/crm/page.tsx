"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { crmApi } from "@/lib/api";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, Users, Target, Phone, Mail, 
  Clock, CheckCircle, XCircle, ArrowRight, ArrowLeft, Loader2 
} from "lucide-react";

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  company: string;
  funnel_type: string;
  source: string;
  status: string;
  created_at: string;
};

const COLUMNS = [
  { id: "novo", title: "Novos Leads", color: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
  { id: "em_contato", title: "Em Contato", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" },
  { id: "negociando", title: "Em Negociação", color: "bg-orange-500/10 border-orange-500/30 text-orange-400" },
  { id: "convertido", title: "Convertidos", color: "bg-green-500/10 border-green-500/30 text-green-400" },
  { id: "perdido", title: "Perdidos", color: "bg-red-500/10 border-red-500/30 text-red-400" },
];

export default function CRMPipefyPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await crmApi.getLeads();
      setLeads(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const moveLead = async (leadId: string, newStatus: string) => {
    setMovingLeadId(leadId);
    try {
      await crmApi.updateLeadStatus(leadId, newStatus);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    } catch (err) {
      console.error(err);
    } finally {
      setMovingLeadId(null);
    }
  };

  const formatFunnel = (type: string) => {
    if (type === "white_label") return "Investidor (White-Label)";
    if (type === "lojista") return "Lojista (B2B)";
    return "Comprador (B2C)";
  };

  return (
    <div className="min-h-screen bg-[#020205] text-neutral-200">
      <Header />
      
      <main className="pt-24 pb-20 px-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Target className="w-8 h-8 text-[#E6B53C]" />
              CRM SuperAdmin
            </h1>
            <p className="text-neutral-400 mt-2">Central de Inteligência de Vendas e Controle de Leads</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-[#050510] border border-white/10 rounded-xl px-6 py-3 flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-neutral-500 uppercase">Total de Leads</span>
                <span className="text-2xl font-black text-white">{leads.length}</span>
              </div>
              <Users className="w-8 h-8 text-neutral-600" />
            </div>
            <div className="bg-gradient-to-br from-[#E6B53C]/20 to-transparent border border-[#E6B53C]/30 rounded-xl px-6 py-3 flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#E6B53C] uppercase">Taxa de Conversão</span>
                <span className="text-2xl font-black text-white">
                  {leads.length > 0 ? Math.round((leads.filter(l => l.status === "convertido").length / leads.length) * 100) : 0}%
                </span>
              </div>
              <Target className="w-8 h-8 text-[#E6B53C]" />
            </div>
          </div>
        </div>

        {/* PIPEFY KANBAN BOARD */}
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
          {loading ? (
            <div className="w-full flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-[#E6B53C] animate-spin" />
            </div>
          ) : (
            COLUMNS.map(column => {
              const columnLeads = leads.filter(l => l.status === column.id);
              
              return (
                <div key={column.id} className="min-w-[320px] w-[320px] flex-shrink-0 flex flex-col snap-start">
                  {/* Column Header */}
                  <div className={`px-4 py-3 rounded-t-xl border-x border-t ${column.color} border-b-0 flex justify-between items-center bg-[#050510]`}>
                    <span className="font-black tracking-wide uppercase text-sm">{column.title}</span>
                    <span className="bg-black/40 px-3 py-1 rounded-full text-xs font-bold">{columnLeads.length}</span>
                  </div>
                  
                  {/* Column Body */}
                  <div className="bg-[#050510]/50 border border-white/5 rounded-b-xl p-3 flex-grow min-h-[600px] flex flex-col gap-3">
                    {columnLeads.length === 0 ? (
                      <div className="text-center py-10 text-neutral-600 text-sm font-medium border-2 border-dashed border-white/5 rounded-xl">
                        Nenhum lead aqui
                      </div>
                    ) : (
                      columnLeads.map(lead => (
                        <motion.div 
                          layoutId={lead.id}
                          key={lead.id} 
                          className="bg-[#0A0A15] border border-white/10 rounded-xl p-4 hover:border-[#E6B53C]/40 transition-colors shadow-lg group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-white text-lg leading-tight">{lead.name}</h3>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {movingLeadId === lead.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#E6B53C]" />
                              ) : (
                                <select 
                                  value={lead.status}
                                  onChange={(e) => moveLead(lead.id, e.target.value)}
                                  className="bg-black border border-white/20 rounded px-1 py-0.5 text-xs text-white outline-none cursor-pointer hover:border-[#E6B53C]"
                                >
                                  {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-xs text-[#E6B53C] font-semibold mb-3 bg-[#E6B53C]/10 px-2 py-1 rounded w-fit">
                            {formatFunnel(lead.funnel_type)}
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-xs text-neutral-400">
                              <Phone className="w-3 h-3" />
                              <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" className="hover:text-white transition-colors">{lead.phone}</a>
                            </div>
                            {lead.email && (
                              <div className="flex items-center gap-2 text-xs text-neutral-400">
                                <Mail className="w-3 h-3" />
                                <span>{lead.email}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t border-white/5 text-[10px] uppercase text-neutral-500 font-bold tracking-wider flex justify-between">
                            <span>Origem:</span>
                            <span className="text-neutral-300">{lead.source}</span>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
