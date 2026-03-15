'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserPlus, Trash2, Users, ToggleLeft, ToggleRight, Loader2, Pencil, Check, X, Search } from 'lucide-react';
import { SquadPlayer, POSITIONS } from '@/types';
import { useLanguage } from '@/components/LanguageProvider';
import { t } from '@/lib/i18n';

function overallColor(ovr: number): string {
  if (ovr >= 90) return 'bg-draw/20 text-draw border border-draw/40';
  if (ovr >= 80) return 'bg-win/20 text-win border border-win/40';
  if (ovr >= 70) return 'bg-primary/20 text-primary border border-primary/40';
  if (ovr >= 60) return 'bg-[#94A3B8]/20 text-[#94A3B8] border border-[#94A3B8]/30';
  return 'bg-[#273246] text-[#94A3B8] border border-[#273246]';
}

const positionColor: Record<string, string> = {
  GK:  'bg-draw/20 text-draw',
  CB:  'bg-chart-5/20 text-chart-5',
  LB:  'bg-chart-5/20 text-chart-5',
  RB:  'bg-chart-5/20 text-chart-5',
  CDM: 'bg-win/20 text-win',
  CM:  'bg-win/20 text-win',
  CAM: 'bg-chart-4/20 text-chart-4',
  LM:  'bg-win/20 text-win',
  RM:  'bg-win/20 text-win',
  LW:  'bg-chart-4/20 text-chart-4',
  RW:  'bg-chart-4/20 text-chart-4',
  ST:  'bg-loss/20 text-loss',
  CF:  'bg-loss/20 text-loss',
};

export default function SquadPage() {
  const { lang } = useLanguage();
  const [players,  setPlayers]  = useState<SquadPlayer[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [search,   setSearch]   = useState('');

  // Add form
  const [name,     setName]     = useState('');
  const [position, setPosition] = useState('ST');
  const [overall,  setOverall]  = useState('');

  // Inline overall edit
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [editingOvr, setEditingOvr] = useState('');

  async function fetchSquad() {
    setLoading(true);
    const { data, error } = await supabase
      .from('squad')
      .select('*')
      .order('position', { ascending: true })
      .order('name',     { ascending: true });
    if (error) setError(error.message);
    else setPlayers(data as SquadPlayer[]);
    setLoading(false);
  }

  useEffect(() => { fetchSquad(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated.'); setSaving(false); return; }
    const ovrNum = overall !== '' ? parseInt(overall, 10) : null;
    const { error } = await supabase.from('squad').insert({
      user_id:  user.id,
      name:     name.trim(),
      position,
      overall:  ovrNum && ovrNum >= 1 && ovrNum <= 99 ? ovrNum : null,
      is_active: true,
    });
    if (error) setError(error.message);
    else { setName(''); setOverall(''); fetchSquad(); }
    setSaving(false);
  }

  async function handleToggle(player: SquadPlayer) {
    await supabase.from('squad').update({ is_active: !player.is_active }).eq('id', player.id);
    fetchSquad();
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove player from squad?')) return;
    await supabase.from('squad').delete().eq('id', id);
    fetchSquad();
  }

  async function saveOverall(id: string) {
    const val = editingOvr.trim();
    const num = val !== '' ? parseInt(val, 10) : null;
    const ovrToSave = num && num >= 1 && num <= 99 ? num : null;
    await supabase.from('squad').update({ overall: ovrToSave }).eq('id', id);
    setEditingId(null);
    fetchSquad();
  }

  const activeCount = players.filter(p => p.is_active).length;
  const filtered    = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.position.toLowerCase().includes(search.toLowerCase())
  );
  const topPlayer   = players.filter(p => p.is_active && p.overall).sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0))[0];

  return (
    <div className="min-h-screen bg-background text-[#F1F5F9]">
      {/* Page Header */}
      <div className="px-4 pt-5 pb-4 flex items-center gap-3">
        <Users className="text-primary" size={22} />
        <div>
          <h1 className="text-2xl font-heading font-bold">{t('nav_squad', lang)}</h1>
          <p className="text-xs text-[#94A3B8]">{activeCount} active players</p>
        </div>
      </div>

      <div className="px-4 space-y-6 pb-6">

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search player or position..."
            className="w-full bg-card border border-[#273246] rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition placeholder:text-[#94A3B8]"
          />
        </div>

        {/* Top Performer card */}
        {topPlayer && !search && (
          <div className="relative rounded-2xl overflow-hidden border border-[#273246] bg-gradient-to-br from-primary/20 to-card">
            <div className="p-5">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
                ⭐ Highest Rated
              </p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-[#94A3B8] mb-0.5">{topPlayer.position}</p>
                  <h2 className="text-2xl font-heading font-extrabold tracking-tight">{topPlayer.name}</h2>
                </div>
                <div className="text-right">
                  <span className={`text-4xl font-heading font-black ${overallColor(topPlayer.overall!)} px-3 py-1 rounded-xl`}>
                    {topPlayer.overall}
                  </span>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase mt-1">Overall</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Form */}
        <form onSubmit={handleAdd} className="bg-card border border-[#273246] rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Add Player</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name (e.g. Mbappé)"
              className="col-span-2 bg-background border border-[#273246] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition placeholder:text-[#94A3B8]"
              required
            />
            <select
              value={position}
              onChange={e => setPosition(e.target.value)}
              className="bg-background border border-[#273246] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition"
            >
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              type="number"
              min={1} max={99}
              value={overall}
              onChange={e => setOverall(e.target.value)}
              placeholder="Overall (e.g. 94)"
              className="bg-background border border-[#273246] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition placeholder:text-[#94A3B8]"
            />
          </div>
          {error && <p className="text-loss text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl transition shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {saving ? 'Saving...' : 'Add to Squad'}
          </button>
        </form>

        {/* Player List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-[#94A3B8]">
            <Users size={40} className="mx-auto mb-3 opacity-20" />
            <p>{search ? 'No players found.' : 'No players in your squad yet.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(player => (
              <div
                key={player.id}
                className={`flex items-center gap-3 bg-card border rounded-xl px-4 py-3 transition ${
                  player.is_active ? 'border-[#273246]' : 'border-[#273246]/40 opacity-40'
                }`}
              >
                {/* Position badge */}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${positionColor[player.position] || 'bg-[#273246] text-[#94A3B8]'}`}>
                  {player.position}
                </span>

                {/* Name */}
                <span className={`flex-1 font-semibold text-sm ${!player.is_active ? 'line-through text-[#94A3B8]' : ''}`}>
                  {player.name}
                </span>

                {/* Overall badge / inline edit */}
                {editingId === player.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min={1} max={99}
                      value={editingOvr}
                      onChange={e => setEditingOvr(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveOverall(player.id); if (e.key === 'Escape') setEditingId(null); }}
                      autoFocus
                      className="w-14 text-center bg-background border border-primary text-white font-bold text-sm rounded-lg px-1 py-1 outline-none"
                      placeholder="OVR"
                    />
                    <button onClick={() => saveOverall(player.id)} className="text-win hover:text-win/80 p-0.5"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)}     className="text-loss hover:text-loss/80 p-0.5"><X     size={14} /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingId(player.id); setEditingOvr(player.overall?.toString() ?? ''); }}
                    className="group flex-shrink-0"
                    title="Edit overall"
                  >
                    {player.overall ? (
                      <span className={`text-xs font-black px-2 py-1 rounded-lg ${overallColor(player.overall)}`}>
                        {player.overall}
                      </span>
                    ) : (
                      <span className="text-xs text-[#94A3B8] border border-dashed border-[#273246] px-2 py-1 rounded-lg group-hover:border-primary/50 group-hover:text-primary transition flex items-center gap-1">
                        <Pencil size={10} /> OVR
                      </span>
                    )}
                  </button>
                )}

                {/* Toggle active */}
                <button
                  onClick={() => handleToggle(player)}
                  title={player.is_active ? 'Deactivate' : 'Activate'}
                  className="text-[#94A3B8] hover:text-white transition flex-shrink-0"
                >
                  {player.is_active
                    ? <ToggleRight size={22} className="text-primary" />
                    : <ToggleLeft  size={22} />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(player.id)}
                  title="Remove"
                  className="text-[#94A3B8] hover:text-loss transition flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
