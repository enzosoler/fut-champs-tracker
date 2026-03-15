'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserPlus, Trash2, Users, ToggleLeft, ToggleRight, Loader2, Pencil, Check, X } from 'lucide-react';
import { SquadPlayer, POSITIONS } from '@/types';
import { useLanguage } from '@/components/LanguageProvider';
import { t } from '@/lib/i18n';

function overallColor(ovr: number): string {
  if (ovr >= 90) return 'bg-[#FFB800] text-black';
  if (ovr >= 80) return 'bg-green-500 text-black';
  if (ovr >= 70) return 'bg-blue-500 text-white';
  if (ovr >= 60) return 'bg-gray-500 text-white';
  return 'bg-gray-700 text-gray-300';
}

export default function SquadPage() {
  const { lang } = useLanguage();
  const [players,  setPlayers]  = useState<SquadPlayer[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Add form
  const [name,     setName]     = useState('');
  const [position, setPosition] = useState('ST');
  const [overall,  setOverall]  = useState('');

  // Inline overall edit
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editingOvr,   setEditingOvr]   = useState('');

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
    if (!user) { setError('Não autenticado.'); setSaving(false); return; }
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
    if (!confirm('Remover jogador do elenco?')) return;
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

  const positionColor: Record<string, string> = {
    GK:  'bg-yellow-500/20 text-yellow-400',
    CB:  'bg-blue-500/20 text-blue-400',
    LB:  'bg-blue-500/20 text-blue-400',
    RB:  'bg-blue-500/20 text-blue-400',
    CDM: 'bg-green-500/20 text-green-400',
    CM:  'bg-green-500/20 text-green-400',
    CAM: 'bg-orange-500/20 text-orange-400',
    LM:  'bg-green-500/20 text-green-400',
    RM:  'bg-green-500/20 text-green-400',
    LW:  'bg-orange-500/20 text-orange-400',
    RW:  'bg-orange-500/20 text-orange-400',
    ST:  'bg-red-500/20 text-red-400',
    CF:  'bg-red-500/20 text-red-400',
  };

  const activeCount = players.filter(p => p.is_active).length;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="max-w-2xl mx-auto p-4 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-[#FFB800]" size={24} />
            <div>
              <h1 className="text-2xl font-black">{t('nav_squad', lang)}</h1>
              <p className="text-xs text-gray-500">{activeCount} ativos</p>
            </div>
          </div>
        </div>

        {/* Add Form */}
        <form onSubmit={handleAdd} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Adicionar Jogador</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome (ex: Mbappé)"
              className="col-span-2 bg-[#262626] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800] placeholder:text-gray-600"
              required
            />
            <select
              value={position}
              onChange={e => setPosition(e.target.value)}
              className="bg-[#262626] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#FFB800]"
            >
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              type="number"
              min={1} max={99}
              value={overall}
              onChange={e => setOverall(e.target.value)}
              placeholder="Overall (ex: 94)"
              className="bg-[#262626] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FFB800] placeholder:text-gray-600"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#FFB800] text-black font-bold py-2.5 rounded-xl hover:bg-[#CC9400] transition disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {saving ? 'Salvando...' : 'Adicionar ao Elenco'}
          </button>
        </form>

        {/* Player List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-white" size={32} />
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum jogador no elenco ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {players.map(player => (
              <div
                key={player.id}
                className={`flex items-center gap-3 bg-[#1a1a1a] border rounded-xl px-4 py-3 transition ${
                  player.is_active ? 'border-white/10' : 'border-white/5 opacity-40'
                }`}
              >
                {/* Position badge */}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${positionColor[player.position] || 'bg-gray-700 text-gray-300'}`}>
                  {player.position}
                </span>

                {/* Name */}
                <span className={`flex-1 font-semibold text-sm ${!player.is_active ? 'line-through text-gray-500' : ''}`}>
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
                      className="w-14 text-center bg-[#0d0d0d] border border-[#FFB800] text-white font-bold text-sm rounded-lg px-1 py-1 outline-none"
                      placeholder="OVR"
                    />
                    <button onClick={() => saveOverall(player.id)} className="text-green-400 hover:text-green-300 p-0.5"><Check size={14} /></button>
                    <button onClick={() => setEditingId(null)}     className="text-red-400   hover:text-red-300   p-0.5"><X     size={14} /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingId(player.id); setEditingOvr(player.overall?.toString() ?? ''); }}
                    className="group flex-shrink-0"
                    title="Editar overall"
                  >
                    {player.overall ? (
                      <span className={`text-xs font-black px-2 py-1 rounded-lg ${overallColor(player.overall)}`}>
                        {player.overall}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600 border border-dashed border-gray-700 px-2 py-1 rounded-lg group-hover:border-[#FFB800] group-hover:text-[#FFB800] transition flex items-center gap-1">
                        <Pencil size={10} /> OVR
                      </span>
                    )}
                  </button>
                )}

                {/* Toggle active */}
                <button
                  onClick={() => handleToggle(player)}
                  title={player.is_active ? 'Desativar' : 'Ativar'}
                  className="text-gray-400 hover:text-white transition flex-shrink-0"
                >
                  {player.is_active
                    ? <ToggleRight size={22} className="text-[#FFB800]" />
                    : <ToggleLeft  size={22} />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(player.id)}
                  title="Remover"
                  className="text-gray-600 hover:text-red-400 transition flex-shrink-0"
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
