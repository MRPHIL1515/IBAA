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

type View = 'landing' | 'home' | 'roster' | 'add-match' | 'add-player' | 'stats';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [players, setPlayers] = useState<PlayersData>(() => {
    const saved = localStorage.getItem('ibaa_espoirs_v2');
    if (saved) return JSON.parse(saved);
    
    // Roster Officiel par défaut
    const defaultRoster = [
      "VEH ELIE", "COULIBALY ISMAEL", "KOFFI DANIEL", "KOUADIO STEVEN", 
      "YAYA", "KOUAKOU MALLY", "KOUMAN CHRIST", "EBOH EVRAD", 
      "KOUASSI MOISE", "KADIO SAMUEL", "KONAN KONAN", "ANAS", 
      "SOUALIO", "AUREL", "PAUL"
    ];
    const initial: PlayersData = {};
    defaultRoster.forEach(name => {
      initial[name] = [];
    });
    return initial;
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
    localStorage.setItem('ibaa_espoirs_v2', JSON.stringify(players));
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
      localStorage.removeItem('ibaa_espoirs_v2');
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
            onClick={() => setView('home')}
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

  const DashboardLayout = ({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle?: string }) => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-[#050505] text-slate-200 font-sans pb-24"
    >
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('home')}
              className="bg-emerald-500 p-2 rounded-lg shadow-lg shadow-emerald-500/20"
            >
              <Trophy className="w-5 h-5 text-black" />
            </button>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-white uppercase">
                {title}
              </h1>
              {subtitle && <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">{subtitle}</p>}
            </div>
          </div>
          
          <button 
            onClick={() => setView('landing')}
            className="p-2 text-white/40 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/5 px-6 py-4 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <NavButton icon={<Activity className="w-6 h-6" />} label="Home" active={view === 'home'} onClick={() => setView('home')} />
          <NavButton icon={<Users className="w-6 h-6" />} label="Roster" active={view === 'roster'} onClick={() => setView('roster')} />
          <NavButton icon={<Plus className="w-6 h-6" />} label="Match" active={view === 'add-match'} onClick={() => setView('add-match')} />
          <NavButton icon={<BarChart2 className="w-6 h-6" />} label="Stats" active={view === 'stats'} onClick={() => setView('stats')} />
        </div>
      </nav>
    </motion.div>
  );

  const NavButton = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-emerald-500 scale-110" : "text-white/20 hover:text-white/40"
      )}
    >
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  const HomeHub = () => (
    <DashboardLayout title="IBAA ESPOIRS" subtitle="Performance Hub">
      <div className="grid grid-cols-2 gap-4">
        <HubCard 
          icon={<Users className="w-8 h-8" />} 
          title="Roster" 
          desc={`${playerNames.length} Athlètes`} 
          color="emerald"
          onClick={() => setView('roster')}
        />
        <HubCard 
          icon={<Plus className="w-8 h-8" />} 
          title="Match" 
          desc="Enregistrer" 
          color="blue"
          onClick={() => setView('add-match')}
        />
        <HubCard 
          icon={<BarChart2 className="w-8 h-8" />} 
          title="Stats" 
          desc="Analyses" 
          color="purple"
          onClick={() => setView('stats')}
        />
        <HubCard 
          icon={<Activity className="w-8 h-8" />} 
          title="Nouveau" 
          desc="Joueur" 
          color="orange"
          onClick={() => setView('add-player')}
        />
      </div>

      <div className="mt-8 space-y-4">
        <section className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500" />
              <h2 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Maintenance</h2>
            </div>
            <button 
              onClick={handleResetSystem}
              className="text-[9px] font-black text-rose-500/40 hover:text-rose-500 uppercase tracking-widest"
            >
              Reset Global
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );

  const HubCard = ({ icon, title, desc, color, onClick }: { icon: React.ReactNode, title: string, desc: string, color: string, onClick: () => void }) => {
    const colors: any = {
      emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      orange: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    };
    return (
      <button 
        onClick={onClick}
        className={cn(
          "p-8 rounded-[2.5rem] border flex flex-col items-center text-center gap-4 transition-all hover:scale-[1.02] active:scale-95",
          colors[color]
        )}
      >
        {icon}
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-white">{title}</h3>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{desc}</p>
        </div>
      </button>
    );
  };

  const RosterPage = () => (
    <DashboardLayout title="Roster" subtitle="Gestion des Athlètes">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Liste des Joueurs</h2>
          <button 
            onClick={() => setIsDeleteMode(!isDeleteMode)}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
              isDeleteMode ? "bg-rose-500/20 border-rose-500/50 text-rose-500" : "bg-white/5 border-white/10 text-white/40"
            )}
          >
            {isDeleteMode ? "Terminer" : "Éditer"}
          </button>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-white/5">
              {playerNames.length === 0 ? (
                <tr>
                  <td className="p-20 text-center">
                    <p className="text-white/10 italic mb-6">Aucun athlète détecté</p>
                    <button 
                      onClick={() => {
                        const defaultRoster = [
                          "VEH ELIE", "COULIBALY ISMAEL", "KOFFI DANIEL", "KOUADIO STEVEN", 
                          "YAYA", "KOUAKOU MALLY", "KOUMAN CHRIST", "EBOH EVRAD", 
                          "KOUASSI MOISE", "KADIO SAMUEL", "KONAN KONAN", "ANAS", 
                          "SOUALIO", "AUREL", "PAUL"
                        ];
                        const initial: PlayersData = {};
                        defaultRoster.forEach(name => {
                          initial[name] = [];
                        });
                        setPlayers(initial);
                        toast.success("Roster officiel chargé");
                      }}
                      className="px-6 py-3 bg-emerald-500 text-black font-black rounded-xl uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20"
                    >
                      Charger Roster Officiel
                    </button>
                  </td>
                </tr>
              ) : (
                playerNames.map(name => {
                  const matches = players[name];
                  const stats = calculateStats(matches);
                  return (
                    <tr key={name} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4" onClick={() => { setSelectedPlayer(name); setView('stats'); }}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xs font-black text-emerald-500">
                            {name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white">{name}</div>
                            <div className="text-[9px] text-white/20 uppercase tracking-widest">{matches.length} Matchs</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isDeleteMode ? (
                          <button onClick={() => handleDeletePlayer(name)} className="p-2 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-white/10 ml-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );

  const AddMatchPage = () => (
    <DashboardLayout title="Match" subtitle="Enregistrement Performance">
      <section className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
        <form onSubmit={handleAddMatch} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Athlète</label>
            <select 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none"
              value={formData.selectedName}
              onChange={e => setFormData(prev => ({ ...prev, selectedName: e.target.value }))}
            >
              <option value="" className="bg-slate-900">-- Choisir --</option>
              {playerNames.map(name => <option key={name} value={name} className="bg-slate-900">{name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Date</label>
              <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" value={formData.date} onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Points</label>
              <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" value={formData.points} onChange={e => setFormData(prev => ({ ...prev, points: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Rebonds</label>
              <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" value={formData.rebounds} onChange={e => setFormData(prev => ({ ...prev, rebounds: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Passes</label>
              <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" value={formData.assists} onChange={e => setFormData(prev => ({ ...prev, assists: e.target.value }))} />
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs mt-4">Enregistrer</button>
        </form>
      </section>
    </DashboardLayout>
  );

  const AddPlayerPage = () => (
    <DashboardLayout title="Nouveau" subtitle="Création de Profil">
      <div className="space-y-8">
        <section className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-white uppercase tracking-tight">Ajouter un Athlète</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const defaultRoster = [
                    "VEH ELIE", "COULIBALY ISMAEL", "KOFFI DANIEL", "KOUADIO STEVEN", 
                    "YAYA", "KOUAKOU MALLY", "KOUMAN CHRIST", "EBOH EVRAD", 
                    "KOUASSI MOISE", "KADIO SAMUEL", "KONAN KONAN", "ANAS", 
                    "SOUALIO", "AUREL", "PAUL"
                  ];
                  setPlayers(prev => {
                    const next = { ...prev };
                    defaultRoster.forEach(name => {
                      if (!next[name]) next[name] = [];
                    });
                    return next;
                  });
                  toast.success("Roster officiel restauré");
                }}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-[9px] font-black text-emerald-500 uppercase tracking-widest transition-all"
              >
                Charger Roster Officiel
              </button>
              {playerNames.length > 0 && (
                <button 
                  onClick={() => { if (window.confirm("Vider tout ?")) setPlayers({}); }}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-[9px] font-black text-rose-500 uppercase tracking-widest transition-all"
                >
                  Vider Roster
                </button>
              )}
            </div>
          </div>
          <form onSubmit={handleAddPlayer} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Nom Prénom" 
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" 
              value={formData.name} 
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
            />
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black p-3 rounded-xl transition-all">
              <Plus className="w-5 h-5" />
            </button>
          </form>
        </section>

        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
          <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-4">Athlètes Actuels ({playerNames.length})</h3>
          <div className="flex flex-wrap gap-2">
            {playerNames.map(name => (
              <span key={name} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/60">
                {name}
              </span>
            ))}
            {playerNames.length === 0 && <p className="text-[10px] text-white/20 italic">Aucun joueur enregistré</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );

  const StatsPage = () => (
    <DashboardLayout title="Stats" subtitle="Analyses Détaillées">
      <div className="space-y-8">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Sélectionner un Athlète</label>
          <select 
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none"
            value={selectedPlayer || ''}
            onChange={e => setSelectedPlayer(e.target.value)}
          >
            <option value="" className="bg-slate-900">-- Choisir --</option>
            {playerNames.map(name => <option key={name} value={name} className="bg-slate-900">{name}</option>)}
          </select>
        </div>

        <AnimatePresence mode="wait">
          {selectedPlayer && players[selectedPlayer] && (
            <motion.div 
              key={selectedPlayer}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-3 gap-4">
                <StatBox label="PTS" value={calculateStats(players[selectedPlayer]).pts} />
                <StatBox label="REB" value={calculateStats(players[selectedPlayer]).reb} />
                <StatBox label="AST" value={calculateStats(players[selectedPlayer]).ast} />
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={players[selectedPlayer]}>
                    <defs>
                      <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="points" stroke="#10b981" strokeWidth={4} fill="url(#colorPoints)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Historique</h3>
                {[...players[selectedPlayer]].reverse().map(m => (
                  <div key={m.id} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center group/item">
                    <div className="flex items-center gap-4">
                      <div className="text-xs font-bold text-white/40">{new Date(m.date).toLocaleDateString()}</div>
                      <div className="flex gap-4 text-sm font-black">
                        <span className="text-emerald-500">{m.points}P</span>
                        <span className="text-white/60">{m.rebounds}R</span>
                        <span className="text-white/60">{m.assists}A</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteMatch(selectedPlayer, m.id)}
                      className="p-2 text-white/10 hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );

  const StatBox = ({ label, value }: { label: string, value: string | number }) => (
    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
      <div className="text-xl font-black text-white">{value}</div>
      <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{label}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      <AnimatePresence mode="wait">
        {view === 'landing' && <LandingPage key="landing" />}
        {view === 'home' && <HomeHub key="home" />}
        {view === 'roster' && <RosterPage key="roster" />}
        {view === 'add-match' && <AddMatchPage key="add-match" />}
        {view === 'add-player' && <AddPlayerPage key="add-player" />}
        {view === 'stats' && <StatsPage key="stats" />}
      </AnimatePresence>
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}
