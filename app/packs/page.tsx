'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PackReward, PACK_TYPES } from '@/types';
import { Plus, Loader2, Trash2, Package } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { t } from '@/lib/i18n';

export default function PacksPage() {
  const { lang } = useLanguage();
  const [packs, setPacks] = useState<PackReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [weekId, setWeekId]             = useState('');
  const [packType, setPackType]         = useState(PACK_TYPES[0]);
  const [coinsValue, setCoinsValue]     = useState('');
  const [notablePulls, setNotablePulls] = useState('');
  const [openedAt, setOpenedAt]         = useState(new Date().toISOString().slice(0, 16));

  async function fetchPacks() {
    setLoading(true);
    const { data } = await supabase.from('pack_rewards').select('*').order('opened_at', { ascending: false });
    if (data) setPacks(data as PackReward[]);
    setLoading(false);
  }

  useEffect(() => { fetchPacks(); }, []);

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from('pack_rewards').insert({
      user_id:       user.id,
      week_id:       weekId.trim() || null,
      pack_type:     packType,
      coins_value:   coinsValue !== '' ? parseInt(coinsValue) : 0,
      notable_pulls: notablePulls.trim() || null,
      opened_at:     new Date(openedAt).toISOString(),
    });

    setWeekId(''); setPackType(PACK_TYPES[0]); setCoinsValue('');
    setNotablePulls(''); setOpenedAt(new Date().toISOString().slice(0, 16));
    setShowForm(false);
    setSaving(false);
    fetchPacks();
  }

  async function handleDelete(id: string) {
    if (!confirm(t('delete_pack', lang))) return;
    setDeletingId(id);
    await supabase.from('pack_rewards').delete().eq('id', id);
    setPacks(prev => prev.filter(p => p.id !== id));
    setDeletingId(null);
  }

  const totalCoins = packs.reduce((s, p) => s + p.coins_value, 0);
  const totalPacks  = packs.length;
  const weeks = Array.from(new Set(packs.map(p => p.week_id ?? '—'))).sort((a, b) => b.localeCompare(a));

  if (loading) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <Loader2 className="animate-spin text-white" size={36} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">{t('packs_title', lang)}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{t('packs_sub', lang)}</p>
          </div>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-[#FFB800] text-black font-bold px-4 py-2.5 rounded-xl hover:bg-[#CC9400] transition text-sm">
            <Plus size={16} /> {t('new_pack', lang)}
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black">{totalPacks}</p>
            <p className="text-xs text-gray-400">{t('packs_opened', lang)}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-[#FFB800]">{totalCoins.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{t('total_coins', lang)}</p>
          </div>
        </div>

        {/* Add Pack Form */}
        {showForm && (
          <div className="bg-[#1a1a1a] border border-white/20 rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-sm text-gray-300">{t('register_pack', lang)}</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('week_id', lang)}</label>
                <input type="text" value={weekId} onChange={e => setWeekId(e.target.value)}
                  placeholder={t('week_id_hint', lang)}
                  className="w-full bg-[#262626] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white placeholder:text-gray-600" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('pack_type', lang)}</label>
                <select value={packType} onChange={e => setPackType(e.target.value)}
                  className="w-full bg-[#262626] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white">
                  {PACK_TYPES.map(tp => <option key={tp}>{tp}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('coins_value', lang)}</label>
                <input type="number" min="0" value={coinsValue} onChange={e => setCoinsValue(e.target.value)}
                  placeholder="15000"
                  className="w-full bg-[#262626] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white placeholder:text-gray-600" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">{t('date_time', lang)}</label>
                <input type="datetime-local" value={openedAt} onChange={e => setOpenedAt(e.target.value)}
                  className="w-full bg-[#262626] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400">{t('notable_pulls', lang)}</label>
              <input type="text" value={notablePulls} onChange={e => setNotablePulls(e.target.value)}
                placeholder="Mbappé 97, Vini Jr 95"
                className="w-full bg-[#262626] border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white placeholder:text-gray-600" />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-[#FFB800] text-black font-bold py-2.5 rounded-xl hover:bg-[#CC9400] transition disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {saving ? t('saving', lang) : t('save_pack', lang)}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2.5 border border-white/10 rounded-xl text-sm text-gray-400 hover:border-white/20 transition">
                {t('cancel', lang)}
              </button>
            </div>
          </div>
        )}

        {packs.length === 0 ? (
          <div className="text-center py-16 text-gray-500 space-y-3">
            <Package size={48} className="mx-auto opacity-20" />
            <p>{t('no_data', lang)}</p>
          </div>
        ) : (
          weeks.map(week => {
            const weekPacks = packs.filter(p => (p.week_id ?? '—') === week);
            const weekCoins = weekPacks.reduce((s, p) => s + p.coins_value, 0);
            return (
              <div key={week} className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-gray-300 uppercase tracking-widest">
                    {week === '—' ? t('no_week', lang) : week}
                  </h2>
                  <span className="text-xs text-[#FFB800]">{weekCoins.toLocaleString()} coins</span>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-xs text-gray-600">{weekPacks.length} {t('nav_packs', lang).toLowerCase()}</span>
                </div>

                {weekPacks.map(pack => (
                  <div key={pack.id}
                    className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center">
                      <Package size={16} className="text-[#FFB800]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{pack.pack_type}</p>
                      {pack.notable_pulls && (
                        <p className="text-xs text-gray-400 truncate">⭐ {pack.notable_pulls}</p>
                      )}
                    </div>
                    {pack.coins_value > 0 && (
                      <span className="text-sm font-bold text-[#FFB800]">
                        {pack.coins_value.toLocaleString()} 🪙
                      </span>
                    )}
                    <button onClick={() => handleDelete(pack.id)} disabled={deletingId === pack.id}
                      className="text-gray-700 hover:text-red-400 transition">
                      {deletingId === pack.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
