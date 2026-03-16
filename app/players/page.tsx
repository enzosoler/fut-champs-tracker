'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Search, UserPlus, UserCheck, Clock, X, Loader2, Users, Bell } from 'lucide-react';
import type { Profile, FriendRequest, FriendStatus } from '@/types';

interface PlayerCard {
  profile:  Profile;
  status:   FriendStatus;
  reqId?:   string;
}

export default function PlayersPage() {
  const router = useRouter();
  const [myId,        setMyId]        = useState('');
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState<PlayerCard[]>([]);
  const [friends,     setFriends]     = useState<PlayerCard[]>([]);
  const [pending,     setPending]     = useState<PlayerCard[]>([]); // received requests
  const [loading,     setLoading]     = useState(true);
  const [searching,   setSearching]   = useState(false);
  const [actionId,    setActionId]    = useState('');

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      setMyId(user.id);
      await loadFriendsAndPending(user.id);
      setLoading(false);
    }
    init();
  }, []);

  async function loadFriendsAndPending(userId: string) {
    // Get all friend requests involving me
    const { data: reqs } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`from_id.eq.${userId},to_id.eq.${userId}`);

    if (!reqs) return;

    const acceptedIds = reqs.filter(r => r.status === 'accepted').map(r =>
      r.from_id === userId ? r.to_id : r.from_id
    );
    const pendingReceived = reqs.filter(r => r.status === 'pending' && r.to_id === userId);

    if (acceptedIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles').select('*').in('id', acceptedIds);
      const req = reqs.find(r => r.status === 'accepted');
      setFriends((profiles || []).map(p => {
        const r = reqs.find(rr => rr.status === 'accepted' && (rr.from_id === p.id || rr.to_id === p.id));
        return { profile: p as Profile, status: 'friends', reqId: r?.id };
      }));
    } else {
      setFriends([]);
    }

    if (pendingReceived.length > 0) {
      const fromIds = pendingReceived.map(r => r.from_id);
      const { data: profiles } = await supabase
        .from('profiles').select('*').in('id', fromIds);
      setPending((profiles || []).map(p => {
        const r = pendingReceived.find(rr => rr.from_id === p.id)!;
        return { profile: p as Profile, status: 'pending_received', reqId: r.id };
      }));
    } else {
      setPending([]);
    }
  }

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim() || !myId) { setResults([]); return; }
    setSearching(true);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${q.trim()}%`)
      .neq('id', myId)
      .limit(15);

    if (!profiles || profiles.length === 0) { setResults([]); setSearching(false); return; }

    const ids = profiles.map(p => p.id);
    const { data: reqs } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`from_id.eq.${myId},to_id.eq.${myId}`)
      .or(ids.map(id => `from_id.eq.${id},to_id.eq.${id}`).join(','));

    setResults(profiles.map(p => {
      const req = (reqs || []).find(r =>
        (r.from_id === myId && r.to_id === p.id) ||
        (r.to_id === myId && r.from_id === p.id)
      );
      let status: FriendStatus = 'none';
      if (req) {
        if (req.status === 'accepted') status = 'friends';
        else if (req.status === 'pending' && req.from_id === myId) status = 'pending_sent';
        else if (req.status === 'pending' && req.to_id === myId)   status = 'pending_received';
      }
      return { profile: p as Profile, status, reqId: req?.id };
    }));
    setSearching(false);
  }, [myId]);

  useEffect(() => {
    const t = setTimeout(() => handleSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, handleSearch]);

  async function sendRequest(toId: string) {
    setActionId(toId);
    await supabase.from('friend_requests').insert({ from_id: myId, to_id: toId });
    updateCardStatus(toId, 'pending_sent');
    setActionId('');
  }

  async function acceptRequest(reqId: string, fromId: string) {
    setActionId(fromId);
    await supabase.from('friend_requests').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', reqId);
    await loadFriendsAndPending(myId);
    setResults(prev => prev.map(c => c.reqId === reqId ? { ...c, status: 'friends' } : c));
    setActionId('');
  }

  async function declineRequest(reqId: string, fromId: string) {
    setActionId(fromId);
    await supabase.from('friend_requests').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', reqId);
    setPending(prev => prev.filter(c => c.reqId !== reqId));
    setActionId('');
  }

  async function removeFriend(reqId: string, friendId: string) {
    setActionId(friendId);
    await supabase.from('friend_requests').delete().eq('id', reqId);
    setFriends(prev => prev.filter(c => c.reqId !== reqId));
    setActionId('');
  }

  function updateCardStatus(userId: string, status: FriendStatus) {
    setResults(prev => prev.map(c => c.profile.id === userId ? { ...c, status } : c));
  }

  function ActionButton({ card }: { card: PlayerCard }) {
    const busy = actionId === card.profile.id;
    if (busy) return <Loader2 size={16} className="animate-spin text-primary" />;
    if (card.status === 'friends') return (
      <button onClick={() => removeFriend(card.reqId!, card.profile.id)}
        className="text-[10px] text-[#94A3B8] hover:text-loss border border-[#273246] hover:border-loss/40 px-2.5 py-1 rounded-lg transition">
        Remover
      </button>
    );
    if (card.status === 'pending_sent') return (
      <span className="flex items-center gap-1 text-xs text-[#94A3B8]"><Clock size={13} /> Aguardando</span>
    );
    if (card.status === 'pending_received') return (
      <div className="flex gap-1.5">
        <button onClick={() => acceptRequest(card.reqId!, card.profile.id)}
          className="text-[10px] bg-win/10 text-win border border-win/30 hover:bg-win/20 px-2.5 py-1 rounded-lg font-bold transition">
          Aceitar
        </button>
        <button onClick={() => declineRequest(card.reqId!, card.profile.id)}
          className="text-[10px] text-[#94A3B8] hover:text-loss border border-[#273246] hover:border-loss/40 px-2 py-1 rounded-lg transition">
          <X size={11} />
        </button>
      </div>
    );
    return (
      <button onClick={() => sendRequest(card.profile.id)}
        className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg font-bold transition">
        <UserPlus size={12} /> Adicionar
      </button>
    );
  }

  function PlayerRow({ card, showView = true }: { card: PlayerCard; showView?: boolean }) {
    const initials = card.profile.username.charAt(0).toUpperCase();
    return (
      <div className="flex items-center gap-3 py-3 border-b border-[#273246]/50 last:border-0">
        <button onClick={() => router.push(`/players/${card.profile.username}`)}
          className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 hover:border-primary/50 transition overflow-hidden">
          {card.profile.avatar_url
            ? <img src={card.profile.avatar_url} alt={card.profile.username} className="w-full h-full object-cover" />
            : <span className="text-sm font-bold text-primary">{initials}</span>
          }
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={() => router.push(`/players/${card.profile.username}`)}
            className="text-left hover:text-primary transition">
            <p className="font-mono font-semibold text-sm text-accent">@{card.profile.username}</p>
            {card.profile.full_name && (
              <p className="text-xs text-[#94A3B8] truncate">{card.profile.full_name}</p>
            )}
          </button>
        </div>
        <ActionButton card={card} />
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={28} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-[#F1F5F9] pb-24">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <h1 className="text-2xl font-heading font-black">Players</h1>
        <p className="text-xs text-[#94A3B8] mt-0.5">Busque amigos pelo username</p>
      </div>

      {/* Search */}
      <div className="px-4 mb-5">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por username..."
            className="w-full bg-card border border-[#273246] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition placeholder:text-[#94A3B8]/50"
          />
          {searching && <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-[#94A3B8]" />}
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* Search results */}
        {query.trim() && (
          <div className="bg-card border border-[#273246] rounded-2xl p-4">
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-1">Resultados</p>
            {results.length === 0 && !searching && (
              <p className="text-sm text-[#94A3B8] py-4 text-center">Nenhum usuário encontrado.</p>
            )}
            {results.map(card => <PlayerRow key={card.profile.id} card={card} />)}
          </div>
        )}

        {/* Pending requests */}
        {pending.length > 0 && (
          <div className="bg-card border border-primary/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bell size={13} className="text-primary" />
              <p className="text-xs font-bold text-primary uppercase tracking-widest">
                Pedidos recebidos ({pending.length})
              </p>
            </div>
            {pending.map(card => <PlayerRow key={card.profile.id} card={card} />)}
          </div>
        )}

        {/* Friends list */}
        <div className="bg-card border border-[#273246] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={13} className="text-[#94A3B8]" />
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">
              Amigos ({friends.length})
            </p>
          </div>
          {friends.length === 0 ? (
            <p className="text-sm text-[#94A3B8] py-4 text-center">
              Nenhum amigo ainda. Busque pelo username!
            </p>
          ) : (
            friends.map(card => <PlayerRow key={card.profile.id} card={card} />)
          )}
        </div>

      </div>
    </div>
  );
}
