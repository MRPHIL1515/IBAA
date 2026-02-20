/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  BarChart2,
  ChevronRight,
  ArrowRight,
  Users,
  Activity,
  LogOut,
  X
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';

// Utility for tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Match {
  id: string;
  date: string;
  points: number;
  rebounds: number;
  assists: number;
}

interface PlayersData {
  [name: string]: Match[];
}

type View = 'landing' | 'dashboard';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [players, setPlayers] = useState<PlayersData>(() => {
    const saved = localStorage.getItem('ibaa_espoirs_v1');
    if (saved) return JSON.parse(saved);
    return {};
  });

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isMatchDeleteMode, setIsMatchDeleteMode] = useState(false);
  const [editingMatch, setEditingMatch] = useState<{ playerName: string, match: Match } | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    selectedName: '',
    date: new Date().toISOString().split('T')[0],
    points: '',
    rebounds: '',
    assists: ''
  });

  useEffect(() => {
    if (editingMatch) {
      setFormData({
        name: '',
        selectedName: editingMatch.playerName,
        date: editingMatch.match.date,
        points: editingMatch.match.points.toString(),
        rebounds: editingMatch.match.rebounds.toString(),
        assists: editingMatch.match.assists.toString()
      });
    }
  }, [editingMatch]);

  useEffect(() => {
    localStorage.setItem('ibaa_espoirs_v1', JSON.stringify(players));
  }, [players]);

  const playerNames = useMemo(() => Object.keys(players).sort(), [players]);

  const handleAddMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.selectedName;
    if (!name || !formData.date) {
      toast.error("Veuillez sélectionner un joueur et une date");
      return;
    }

    if (editingMatch) {
      setPlayers(prev => {
        const updated = { ...prev };
        updated[name] = updated[name].map(m => 
          m.id === editingMatch.match.id 
            ? { ...m, date: formData.date, points: parseInt(formData.points) || 0, rebounds: parseInt(formData.rebounds) || 0, assists: parseInt(formData.assists) || 0 }
            : m
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return updated;
      });
      toast.success("Match mis à jour");
      setEditingMatch(null);
    } else {
      const newMatch: Match = {
        id: Math.random().toString(36).substr(2, 9),
        date: formData.date,
        points: parseInt(formData.points) || 0,
        rebounds: parseInt(formData.rebounds) || 0,
        assists: parseInt(formData.assists) || 0,
      };

      setPlayers(prev => {
        const updated = { ...prev };
        updated[name] = [...(updated[name] || []), newMatch].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        return updated;
      });
      toast.success(`Match enregistré pour ${name}`);
    }
    setFormData(prev => ({
      ...prev,
      points: '',
      rebounds: '',
      assists: ''
    }));
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) return;

    if (players[name]) {
      toast.error("Ce joueur existe déjà");
      return;
    }

    setPlayers(prev => ({
      ...prev,
      [name]: []
    }));

    toast.success(`Profil créé pour ${name}`);
    setFormData(prev => ({ ...prev, name: '', selectedName: name }));
  };

  const handleDeletePlayer = (name: string) => {
    if (window.confirm(`ATTENTION : Voulez-vous vraiment supprimer définitivement le profil et toutes les statistiques de ${name} ?`)) {
      setPlayers(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      if (selectedPlayer === name) setSelectedPlayer(null);
      if (formData.selectedName === name) setFormData(prev => ({ ...prev, selectedName: '' }));
      toast.success(`Profil de ${name} supprimé avec succès`);
    }
  };

  const handleDeleteMatch = (playerName: string, matchId: string) => {
    if (!playerName) return;
    
    if (window.confirm("Voulez-vous vraiment supprimer ce match de l'historique ?")) {
      setPlayers(prev => {
        const updatedMatches = (prev[playerName] || []).filter(m => m.id !== matchId);
        return {
          ...prev,
          [playerName]: updatedMatches
        };
      });
      toast.success("Match supprimé avec succès");
    }
  };

  const handleResetPlayerStats = (name: string) => {
    if (window.confirm(`Réinitialiser toutes les statistiques de ${name} ? Tous les matchs seront supprimés.`)) {
      setPlayers(prev => ({
        ...prev,
        [name]: []
      }));
      toast.success(`Statistiques de ${name} réinitialisées`);
    }
  };

  const handleResetSystem = () => {
    if (window.confirm("ALERTE : Voulez-vous vraiment réinitialiser TOUT le système ? Toutes les données seront définitivement perdues.")) {
      localStorage.removeItem('ibaa_espoirs_v1');
      setPlayers({});
      setSelectedPlayer(null);
      setIsDeleteMode(false);
      setIsMatchDeleteMode(false);
      toast.error("Système réinitialisé à zéro");
    }
  };

  const calculateStats = (matches: Match[]) => {
    if (matches.length === 0) return { pts: 0, reb: 0, ast: 0, trend: 'none' };
    
    const total = matches.reduce((acc, m) => ({
      pts: acc.pts + m.points,
      reb: acc.reb + m.rebounds,
      ast: acc.ast + m.assists
    }), { pts: 0, reb: 0, ast: 0 });

    const trend = matches.length >= 2 
      ? matches[matches.length - 1].points >= matches[matches.length - 2].points ? 'up' : 'down'
      : 'none';

    return {
      pts: (total.pts / matches.length).toFixed(1),
      reb: (total.reb / matches.length).toFixed(1),
      ast: (total.ast / matches.length).toFixed(1),
      trend
    };
  };

  const LandingPage = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden px-4"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-5xl w-full relative z-10 text-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <Trophy className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Elite Performance Tracking</span>
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter uppercase leading-[0.9]"
        >
          IBAA <span className="text-emerald-500">ESPOIRS</span>
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-12 font-light leading-relaxed"
        >
          La plateforme officielle de gestion des statistiques pour l'élite du basketball. 
          Analysez, progressez et dominez le terrain avec des données précises.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <button 
            onClick={() => setView('dashboard')}
            className="group relative px-8 py-4 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              Accéder au Dashboard <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
          
          <div className="flex items-center gap-8 text-white/60 text-sm font-medium">
            <div className="flex flex-col items-center">
              <span className="text-white font-bold text-xl">{playerNames.length}</span>
              <span className="text-[10px] uppercase tracking-widest opacity-50">Joueurs</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-white font-bold text-xl">
                {(Object.values(players) as Match[][]).reduce((acc, m) => acc + m.length, 0)}
              </span>
              <span className="text-[10px] uppercase tracking-widest opacity-50">Matchs</span>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-12 left-0 right-0 text-center"
      >
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/20">BY VEH ELIE</p>
      </motion.div>
    </motion.div>
  );

  const Dashboard = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#050505] text-slate-200 font-sans"
    >
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
              <Trophy className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white uppercase">
                IBAA <span className="text-emerald-500">ESPOIRS</span>
              </h1>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Performance Hub</p>
            </div>
          </div>
          
          <button 
            onClick={() => setView('landing')}
            className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest"
          >
            Quitter <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          {/* Danger Zone / Global Actions */}
          <section className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-500" />
                <h2 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Zone Critique</h2>
              </div>
              <button 
                onClick={handleResetSystem}
                className="text-[9px] font-black text-rose-500/40 hover:text-rose-500 uppercase tracking-widest transition-colors"
              >
                Reset Global
              </button>
            </div>
          </section>

          {/* Add Player Section */}
          <section className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">Nouveau Joueur</h2>
              </div>
              {playerNames.length > 0 && (
                <button 
                  onClick={() => {
                    if (window.confirm("Supprimer TOUS les joueurs et leurs statistiques ?")) {
                      setPlayers({});
                      setSelectedPlayer(null);
                      setFormData(prev => ({ ...prev, selectedName: '' }));
                      toast.error("Roster entièrement vidé");
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-[9px] font-black text-rose-500 uppercase tracking-widest transition-all"
                >
                  Vider Roster
                </button>
              )}
            </div>
            <form onSubmit={handleAddPlayer} className="flex gap-2">
              <input 
                type="text"
                placeholder="Nom Prénom"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
              <button 
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-black p-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </section>

          {/* Add Match Form */}
          <section className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 transition-all group-hover:bg-emerald-500/10" />
            
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Activity className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">
                {editingMatch ? "Modifier Match" : "Enregistrer Match"}
              </h2>
            </div>
            
            <form onSubmit={handleAddMatch} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Sélection Joueur</label>
                <div className="flex gap-2">
                  <select 
                    disabled={!!editingMatch}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer disabled:opacity-50"
                    value={formData.selectedName}
                    onChange={e => setFormData(prev => ({ ...prev, selectedName: e.target.value }))}
                  >
                    <option value="" className="bg-slate-900">-- Choisir un joueur --</option>
                    {playerNames.map(name => (
                      <option key={name} value={name} className="bg-slate-900">{name}</option>
                    ))}
                  </select>
                  {formData.selectedName && !editingMatch && (
                    <button 
                      type="button"
                      onClick={() => handleDeletePlayer(formData.selectedName)}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 p-3 rounded-xl border border-rose-500/20 transition-all"
                      title="Supprimer ce joueur"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Date</label>
                  <input 
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    value={formData.date}
                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Points</label>
                  <input 
                    type="number"
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    value={formData.points}
                    onChange={e => setFormData(prev => ({ ...prev, points: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Rebonds</label>
                  <input 
                    type="number"
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    value={formData.rebounds}
                    onChange={e => setFormData(prev => ({ ...prev, rebounds: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Passes</label>
                  <input 
                    type="number"
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    value={formData.assists}
                    onChange={e => setFormData(prev => ({ ...prev, assists: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-2 mt-4 uppercase tracking-widest text-xs"
                >
                  {editingMatch ? "Mettre à jour" : "Enregistrer la Performance"}
                </button>
                {editingMatch && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingMatch(null);
                      setFormData(prev => ({ ...prev, points: '', rebounds: '', assists: '' }));
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white font-black px-6 rounded-2xl transition-all mt-4 uppercase tracking-widest text-[10px]"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </section>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/5 p-6 rounded-3xl">
              <Users className="w-5 h-5 text-emerald-500 mb-4" />
              <div className="text-3xl font-black text-white">{playerNames.length}</div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Joueurs</div>
            </div>
            <div className="bg-white/5 border border-white/5 p-6 rounded-3xl">
              <Activity className="w-5 h-5 text-emerald-500 mb-4" />
              <div className="text-3xl font-black text-white">
                {(Object.values(players) as Match[][]).reduce((acc, m) => acc + m.length, 0)}
              </div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Matchs</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-10">
          <AnimatePresence mode="wait">
            {selectedPlayer && players[selectedPlayer] && (
              <motion.section 
                key={selectedPlayer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{selectedPlayer}</h2>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em] mt-1">Évolution des Points</p>
                  </div>
                  <button 
                    onClick={() => setSelectedPlayer(null)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-white/40" />
                  </button>
                </div>
                
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={players[selectedPlayer]}>
                      <defs>
                        <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#ffffff20" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      />
                      <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="points" 
                        stroke="#10b981" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorPoints)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <section className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Roster & Stats</h2>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">
                  {isDeleteMode ? "Mode Suppression Actif" : "Cliquez pour analyser"}
                </p>
              </div>
              <button 
                onClick={() => setIsDeleteMode(!isDeleteMode)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                  isDeleteMode 
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-500 shadow-lg shadow-rose-500/10" 
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                )}
              >
                {isDeleteMode ? "Quitter Edition" : "Gérer Roster"}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">
                    <th className="px-8 py-5">Athlète</th>
                    <th className="px-8 py-5 text-center">PTS</th>
                    <th className="px-8 py-5 text-center">REB</th>
                    <th className="px-8 py-5 text-center">AST</th>
                    <th className="px-8 py-5 text-center">Trend</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {playerNames.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center text-white/10 italic font-light">
                        Aucun profil athlétique détecté.
                      </td>
                    </tr>
                  ) : (
                    playerNames.map(name => {
                      const matches = players[name] as Match[];
                      const stats = calculateStats(matches);
                      const isSelected = selectedPlayer === name;
                      
                      return (
                        <tr 
                          key={name}
                          onClick={() => setSelectedPlayer(name)}
                          className={cn(
                            "group cursor-pointer transition-all hover:bg-white/[0.04]",
                            isSelected && "bg-emerald-500/[0.03]"
                          )}
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-sm font-black text-emerald-500 border border-white/5 group-hover:border-emerald-500/30 transition-all">
                                {name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-white group-hover:text-emerald-400 transition-colors text-lg tracking-tight">
                                  {name}
                                </div>
                                <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                                  {matches.length} Matchs
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center font-black text-emerald-500 text-xl">
                            {stats.pts}
                          </td>
                          <td className="px-8 py-6 text-center font-bold text-white/60">
                            {stats.reb}
                          </td>
                          <td className="px-8 py-6 text-center font-bold text-white/60">
                            {stats.ast}
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex justify-center">
                              {stats.trend === 'up' ? (
                                <div className="flex items-center gap-1.5 text-emerald-500 text-[9px] font-black bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                                  <TrendingUp className="w-3 h-3" />
                                  UP
                                </div>
                              ) : stats.trend === 'down' ? (
                                <div className="flex items-center gap-1.5 text-rose-500 text-[9px] font-black bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
                                  <TrendingDown className="w-3 h-3" />
                                  DOWN
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-white/20 text-[9px] font-black bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                  <Minus className="w-3 h-3" />
                                  FLAT
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <AnimatePresence>
                                {isDeleteMode ? (
                                  <>
                                    <motion.button 
                                      initial={{ opacity: 0, scale: 0.5 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.5 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleResetPlayerStats(name);
                                      }}
                                      className="px-3 py-2 text-[9px] font-black text-white/40 hover:text-white bg-white/5 rounded-lg uppercase tracking-widest border border-white/10"
                                      title="Réinitialiser Stats"
                                    >
                                      Reset Stats
                                    </motion.button>
                                    <motion.button 
                                      initial={{ opacity: 0, scale: 0.5, x: 20 }}
                                      animate={{ opacity: 1, scale: 1, x: 0 }}
                                      exit={{ opacity: 0, scale: 0.5, x: 20 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePlayer(name);
                                      }}
                                      className="p-3 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-all border border-rose-500/20 shadow-lg shadow-rose-500/10"
                                      title="Supprimer Joueur"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </motion.button>
                                  </>
                                ) : (
                                  <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePlayer(name);
                                    }}
                                    className="p-2 text-white/10 hover:text-rose-500 transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </motion.button>
                                )}
                              </AnimatePresence>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <AnimatePresence>
            {selectedPlayer && (
              <motion.section 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10"
              >
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-tight">Historique Détaillé</h2>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">
                        {isMatchDeleteMode ? "Mode Nettoyage Actif" : "Performances passées"}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMatchDeleteMode(!isMatchDeleteMode)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                      isMatchDeleteMode 
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-500 shadow-lg shadow-rose-500/10" 
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {isMatchDeleteMode ? "Terminer" : "Éditer"}
                  </button>
                </div>
                
                <div className="space-y-4">
                  {[...players[selectedPlayer]].reverse().map((match) => (
                    <div 
                      key={match.id} 
                      className="group/match bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex items-center justify-between hover:bg-white/[0.04] transition-all"
                    >
                      <div className="flex items-center gap-8">
                        <div className="text-center min-w-[80px]">
                          <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">
                            {new Date(match.date).toLocaleDateString('fr-FR', { month: 'short' })}
                          </div>
                          <div className="text-2xl font-black text-white leading-none">
                            {new Date(match.date).toLocaleDateString('fr-FR', { day: '2-digit' })}
                          </div>
                        </div>
                        
                        <div className="h-10 w-px bg-white/5" />
                        
                        <div className="flex items-center gap-12">
                          <div className="text-center">
                            <div className="text-2xl font-black text-emerald-500">{match.points}</div>
                            <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Points</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-black text-white/60">{match.rebounds}</div>
                            <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Rebonds</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-black text-white/60">{match.assists}</div>
                            <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Passes</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMatch({ playerName: selectedPlayer, match });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-3 text-white/10 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                          title="Modifier ce match"
                        >
                          <BarChart2 className="w-5 h-5" />
                        </button>
                        <AnimatePresence>
                          {isMatchDeleteMode && (
                            <motion.button 
                              initial={{ opacity: 0, scale: 0.5, x: 20 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.5, x: 20 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMatch(selectedPlayer, match.id);
                              }}
                              className="p-3 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-all border border-rose-500/20 shadow-lg shadow-rose-500/10"
                              title="Supprimer ce match"
                            >
                              <Trash2 className="w-5 h-5" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-16 border-t border-white/5 mt-20 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-emerald-500 opacity-20" />
            <span className="text-white/20 text-[10px] font-black tracking-[0.5em] uppercase">IBAA ESPOIRS BY VEH ELIE</span>
          </div>
          <p className="text-white/10 text-[10px] uppercase tracking-widest">
            © {new Date().getFullYear()} IBAA Espoirs. All rights reserved. Professional Grade Statistics.
          </p>
        </div>
      </footer>
    </motion.div>
  );

  return (
    <>
      <Toaster position="top-right" theme="dark" richColors />
      <AnimatePresence mode="wait">
        {view === 'landing' ? <LandingPage key="landing" /> : <Dashboard key="dashboard" />}
      </AnimatePresence>
    </>
  );
}
