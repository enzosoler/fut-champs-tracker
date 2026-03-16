'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  ChevronLeft, Trophy, Swords, Users, Loader2, Lock, BarChart2
} from 'lucide-react';
import type { Profile, Match, WLSession, SquadPlayer, FriendStatus } from '@/types';
import { getMatchResult, RANK_THRESHOLDS } from '@/types';

function getRank(wins: number) {
  let rank = 'Sem Rank';
  for (const t of RANK_THRESHOLDS) {
    if (wins >= t.wins) rank = t.rank;
  }
  return rank;
}

export default function PlayerProfilePage() {
  const router   = useRouter();
  const { username } = useParams<{ username: string }>();

  const [myId,     setMyId]     = useState('');
  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [status,   setStatus]   = useState<FriendStatus>('none');
  const [reqId,    setReqId]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const [actionLd, setActionLd] = useState(false);
  const [tab,      setTab]      = useState<'wl' | 'squad'>('wl');

  // Friend's data (only loaded if friends)
  const [matches,  setMatches]  = useState<Match[]>([]);
  const [squad,    setSquad]    = useState<SquadPlayer[]>([]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      setMyId(user.id);

      // Load profile
      const { data: prof } = await supabase
        .from('profiles').select('*').eq('username', username.toLowerCase()).maybeSingle();
      if (!prof) { setLoading(false); return; }
      setProfile(prof as Profile);

      // Check friendship status
      const { data: req } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(from_id.eq.${user.id},to_id.eq.${prof.id}),and(from_id.eq.${prof.id},to_id.eq.${user.id})`)
        .maybeSingle();

      if (req) {
        setReqId(req.id);
        if (req.status === 'accepted') {
          setStatus('friends');
          await loadFriendData(prof.id);
        } else if (req.status === 'pending' && req.from_id === user.id) {
          setStatus('pending_sent');
        } else if (req.status === 'pending' && req.to_id === user.id) {
          setStatus('pending_received');
        }
      }

      setLoading(false);
    }
    init();
  }, [username]);

  async function loadFriendData(friendId: string) {
    const [{ data: matchData }, { data: squadData }] = await Promise.all([
      supabase.from('matches').select('*').eq('user_id', friendId).order('created_at', { ascending: false }),
      supabase.from('squad').select('*').eq('user_id', friendId).eq('is_active', true),
    ]);
    if (matchData) setMatches(matchData as Match[]);
    if (squadData) setSquad(squadData as SquadPlayer[]);
  }

  async function sendRequest() {
    if (!profile) return;
    setActionLd(true);
    const { data } = await supabase
      .from('friend_requests').insert({ from_id: myId, to_id: profile.id }).select().single();
    if (data) { setReqId(data.id); setStatus('pending_sent'); }
    setActionLd(false);
  }

  async function acceptRequest() {
    if (!reqId) return;
    setActionLd(true);
    await supabase.from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', reqId);
    setStatus('friends');
    if (profile) await loadFriendData(profile.id);
    setActionLd(false);
  }

  // WL stats from matches
  const wlWeeks = Array.from(new Set(matches.map(m => m.week_id)));
  const wlSessions = wlWeeks.map(wkId => {
    const wm = matches.filter(m => m.week_id === wkId);
    const wins   = wm.filter(m => getMatchResult(m) === 'W').length;
    const losses = wm.filter(m => getMatchResult(m) === 'L').length;
    const draws  = wm.filter(m => getMatchResult(m) === 'D').length;
    return { wkId, wins, losses, draws, total: wm.length, rank: getRank(wins) };
  });

  const totalWins   = matches.filter(m => getMatchResult(m) === 'W').length;
  const totalLosses = matches.filter(m => getMatchResult(m) === 'L').length;
  const totalDraws  = matches.filter(m => getMatchResult(m) === 'D').length;

  const posColor: Record<string, string> = {
    GK: 'bg-chart-4/20 text-chart-4', CB: 'bg-win/20 text-win', LB: 'bg-win/20 text-win',
    RB: 'bg-win/20 text-win', CDM: 'bg-accent/20 text-accent', CM: 'bg-accent/20 text-accent',
    CAM: 'bg-primary/20 text-primary', LM: 'bg-primary/20 text-primary',
    RM: 'bg-primary/20 text-primary', LW: 'bg-chart-1/20 text-chart-1',
    RW: 'bg-chart-1/20 text-chart-1', ST: 'bg-loss/20 text-loss', CF: 'bg-loss/20 text-loss',
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={28} />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-[#94A3B8] text-lg">Usuário não encontrado.</p>
      <button onClick={() => router.back()} className="text-primary font-semibold">← Voltar</button>
    </div>
  );

  const initials = profile.username.charAt(0).toUpperCase();
  const isFriend = status === 'friends';

  return (
    <div className="min-h-screen bg-background text-[#F1F5F9] pb-24">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-card border border-[#273246] flex items-center justify-center hover:border-primary/40 transition">
          <ChevronLeft size={18} className="text-[#94A3B8]" />
        </button>
        <div>
          <h1 className="font-heading font-bold text-lg">@{profile.username}</h1>
          {profile.full_name && <p className="text-xs text-[#94A3B8]">{profile.full_name}</p>}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Profile card */}
        <div className="bg-card border border-[#273246] rounded-2xl p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-primary/30 overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-primary">{initials}</span>
            }
          </div>
          <div className="flex-1">
            <p className="font-mono font-bold text-accent text-lg">@{profile.username}</p>
            {profile.full_name && <p className="text-sm text-[#94A3B8]">{profile.full_name}</p>}
            {isFriend && (
              <div className="flex gap-3 mt-2 text-xs text-[#94A3B8]">
                <span className="text-win font-bold">{totalWins}V</span>
                <span className="text-draw font-bold">{totalDraws}E</span>
                <span className="text-loss font-bold">{totalLosses}D</span>
                <span>· {matches.length} partidas</span>
              </div>
            )}
          </div>
          {/* Friend action button */}
          {status === 'none' && (
            <button onClick={sendRequest} disabled={actionLd}
              className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 px-3 py-2 rounded-xl text-sm font-bold transition">
              {actionLd ? <Loader2 size={14} className="animate-spin" /> : <>Adicionar</>}
            </button>
          )}
          {status === 'pending_sent' && (
            <span className="text-xs text-[#94A3B8] border border-[#273246] px-3 py-2 rounded-xl">Aguardando</span>
          )}
          {status === 'pending_received' && (
            <button onClick={acceptRequest} disabled={actionLd}
              className="bg-win/10 text-win border border-win/30 hover:bg-win/20 px-3 py-2 rounded-xl text-sm font-bold transition">
              {actionLd ? <Loader2 size={14} className="animate-spin" /> : 'Aceitar'}
            </button>
          )}
          {status === 'friends' && (
            <span className="flex items-center gap-1 text-xs text-win"><Users size={12} /> Amigos</span>
          )}
        </div>

        {/* Locked state */}
        {!isFriend && (
          <div className="bg-card border border-[#273246] rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-[#273246] flex items-center justify-center">
              <Lock size={20} className="text-[#94A3B8]" />
            </div>
            <p className="font-semibold text-[#94A3B8]">Stats privadas</p>
            <p className="text-xs text-[#94A3B8]/70 leading-relaxed max-w-[200px]">
              Adicione {profile.username} como amigo para ver WL, squad e analytics.
            </p>
          </div>
        )}

        {/* Tabs — only if friends */}
        {isFriend && (
          <>
            <div className="flex bg-card border border-[#273246] rounded-xl p-1 gap-1">
              {([['wl', Trophy, 'Weekend League'], ['squad', Users, 'Squad']] as const).map(([key, Icon, label]) => (
                <button key={key} onClick={() => setTab(key as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
                    tab === key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-[#94A3B8] hover:text-white'
                  }`}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            {/* WL Tab */}
            {tab === 'wl' && (
              <div className="space-y-3">
                {wlSessions.length === 0 && (
                  <div className="bg-card border border-[#273246] rounded-2xl p-6 text-center">
                    <p className="text-[#94A3B8] text-sm">Nenhuma Weekend League registrada.</p>
                  </div>
                )}
                {wlSessions.map(s => {
                  const pct = s.wins / 13;
                  return (
                    <div key={s.wkId} className="bg-card border border-[#273246] rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">{s.wkId}</p>
                        <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">{s.rank}</span>
                      </div>
                      <div className="flex gap-4 text-sm mb-3">
                        <span className="text-win font-black">{s.wins}V</span>
                        <span className="text-draw font-bold">{s.draws}E</span>
                        <span className="text-loss font-bold">{s.losses}D</span>
                        <span className="text-[#94A3B8] text-xs self-center">{s.total} partidas</span>
                      </div>
                      <div className="h-1.5 bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                          style={{ width: `${Math.min(pct * 100, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Squad Tab */}
            {tab === 'squad' && (
              <div className="bg-card border border-[#273246] rounded-2xl divide-y divide-[#273246]/50">
                {squad.length === 0 && (
                  <p className="text-center text-[#94A3B8] text-sm p-6">Squad vazio.</p>
                )}
                {squad.sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0)).map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${posColor[p.position] ?? 'bg-muted text-[#94A3B8]'}`}>
                      {p.position}
                    </span>
                    <span className="flex-1 font-semibold text-sm">{p.name}</span>
                    <span className="text-sm font-black text-primary">{p.overall ?? '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
