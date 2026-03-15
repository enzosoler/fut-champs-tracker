'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserPlus, Trash2, Users, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { SquadPlayer, POSITIONS } from '@/types';

export default function SquadPage() {
  
  const [players, setPlayers] = useState<SquadPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [position, setPosition] = useState('ST');

  async function fetchSquad() {
    setLoading(true);
    const { data, error } = await supabase
      .from('squad')
      .select('*')
      .order('position', { ascending: true })
      .order('name', { ascending: true });
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
    const { error } = await supabase.from('squad').insert({
      user_id: user.id,
      name: name.trim(),
      position,
      is_active: true,
    });
    if (error) setError(error.message);
    else { setName(''); fetchSquad(); }
    setSaving(false);
  }

  async function handleToggle(player: SquadPlayer) {
    await supabase.from('squad').update({ is_active: !player.is_active }).eq('id', player.id);
    fetchSquad();
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover jogador do elenco? Os registros de partidas associados também serão deletados.')) return;
    await supabase.from('squad').delete().eq('id', id);
    fetchSquad();
  }

  const positionColor: Record<string, string> = {
    GK: 'bg-yellow-500/20 text-yellow-400',
    CB: 'bg-blue-500/20 text-blue-400',
    LB: 'bg-blue-500/20 text-blue-400',
    RB: 'bg-blue-500/20 text-blue-400',
    CDM: 'bg-green-500/20 text-green-400',
    CM: 'bg-green-500/20 text-green-400',
    CAM: 'bg-orange-500/20 text-orange-400',
    LM: 'bg-green-500/20 text-green-400',
    RM: 'bg-green-500/20 text-green-400',
    LW: 'bg-orange-500/20 text-orange-400',
    RW: 'bg-orange-500/20 text-orange-400',
    ST: 'bg-red-500/20 text-red-400',
    CF: 'bg-red-500/20 text-red-400',
  };

  const activeCount = players.filter(p => p.is_active).length;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Users className="text-white" size={28} />
          <div>
            <h1 className="text-2xl font-bold">Meu Elenco</h1>
            <p className="text-sm text-gray-400">{activeCount} jogadores ativos</p>
          </div>
        </div>

        {/* Add Form */}
        <form onSubmit={handleAdd} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Adicionar Jogador</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome do jogador (ex: Ronaldo)"
              className="flex-1 bg-[#262626] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white placeholder:text-gray-600"
              required
            />
            <select
              value={position}
              onChange={e => setPosition(e.target.value)}
              className="bg-[#262626] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white"
            >
              {POSITIONS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
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
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${positionColor[player.position] || 'bg-gray-700 text-gray-300'}`}>
                  {player.position}
                </span>
                <span className={`flex-1 font-medium ${!player.is_active ? 'line-through text-gray-500' : ''}`}>
                  {player.name}
                </span>
                <button
                  onClick={() => handleToggle(player)}
                  title={player.is_active ? 'Desativar' : 'Ativar'}
                  className="text-gray-400 hover:text-white transition"
                >
                  {player.is_active
                    ? <ToggleRight size={22} className="text-white" />
                    : <ToggleLeft size={22} />
                  }
                </button>
                <button
                  onClick={() => handleDelete(player.id)}
                  title="Remover"
                  className="text-gray-600 hover:text-red-400 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
