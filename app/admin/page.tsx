'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Shield, Users, Crown, UserX, Loader2,
  ChevronLeft, Search, Star, Trash2, Check, X
} from 'lucide-react';

interface AdminUser {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  plan: 'free' | 'premium';
  created_at: string;
  email?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers]       = useState<AdminUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [isAdmin, setIsAdmin]   = useState(false);
  const [search, setSearch]     = useState('');
  const [saving, setSaving]     = useState<string | null>(null);
  const [myId, setMyId]         = useState<string>('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      setMyId(user.id);

      // Check admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        router.replace('/dashboard');
        return;
      }
      setIsAdmin(true);

      // Load all users
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setUsers(data as AdminUser[]);
      setLoading(false);
    }
    load();
  }, [router]);

  async function toggleAdmin(userId: string, current: boolean) {
    if (userId === myId) return; // can't remove own admin
    setSaving(userId + '-admin');
    await supabase.from('profiles').update({ is_admin: !current }).eq('id', userId);
    setUsers(u => u.map(x => x.id === userId ? { ...x, is_admin: !current } : x));
    setSaving(null);
  }

  async function togglePlan(userId: string, current: 'free' | 'premium') {
    setSaving(userId + '-plan');
    const next = current === 'free' ? 'premium' : 'free';
    await supabase.from('profiles').update({ plan: next }).eq('id', userId);
    setUsers(u => u.map(x => x.id === userId ? { ...x, plan: next } : x));
    setSaving(null);
  }

  async function deleteUser(userId: string) {
    if (userId === myId) return;
    if (!confirm('Remove this user? This cannot be undone.')) return;
    setSaving(userId + '-delete');
    await supabase.from('profiles').delete().eq('id', userId);
    setUsers(u => u.filter(x => x.id !== userId));
    setSaving(null);
  }

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    premium: users.filter(u => u.plan === 'premium').length,
    admins: users.filter(u => u.is_admin).length,
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={36} />
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background text-[#F1F5F9] pb-24">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-[#273246]">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-card border border-[#273246] flex items-center justify-center">
            <ChevronLeft size={18} className="text-[#94A3B8]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-primary" />
              <h1 className="text-lg font-heading font-bold">Admin Panel</h1>
            </div>
            <p className="text-xs text-[#94A3B8]">User management</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Users', value: stats.total, color: 'text-white' },
            { label: 'Premium', value: stats.premium, color: 'text-draw' },
            { label: 'Admins', value: stats.admins, color: 'text-primary' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-[#273246] rounded-xl p-3 text-center">
              <p className={`text-2xl font-heading font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-[#94A3B8] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-[#273246]">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by username..."
            className="w-full bg-card border border-[#273246] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#94A3B8]/50 focus:outline-none focus:border-primary/50 transition"
          />
        </div>
      </div>

      {/* User list */}
      <div className="divide-y divide-[#273246]">
        {filtered.map(user => (
          <div key={user.id} className={`px-4 py-4 ${user.id === myId ? 'bg-primary/5' : ''}`}>
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-primary">{(user.username || '?').charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-white truncate">@{user.username}</p>
                  {user.id === myId && <span className="text-[10px] text-primary font-bold">(you)</span>}
                  {user.is_admin && <Shield size={11} className="text-primary flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    user.plan === 'premium'
                      ? 'bg-draw/20 text-draw border border-draw/30'
                      : 'bg-[#273246] text-[#94A3B8]'
                  }`}>
                    {user.plan === 'premium' ? '⭐ Premium' : 'Free'}
                  </span>
                  <span className="text-[10px] text-[#475569]">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {user.id !== myId && (
                <div className="flex items-center gap-1.5">
                  {/* Toggle premium */}
                  <button
                    onClick={() => togglePlan(user.id, user.plan)}
                    disabled={saving === user.id + '-plan'}
                    title={user.plan === 'premium' ? 'Downgrade to Free' : 'Upgrade to Premium'}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                      user.plan === 'premium'
                        ? 'bg-draw/20 border border-draw/40 text-draw'
                        : 'bg-card border border-[#273246] text-[#94A3B8] hover:text-draw'
                    }`}
                  >
                    {saving === user.id + '-plan'
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Star size={13} />
                    }
                  </button>

                  {/* Toggle admin */}
                  <button
                    onClick={() => toggleAdmin(user.id, user.is_admin)}
                    disabled={saving === user.id + '-admin'}
                    title={user.is_admin ? 'Remove admin' : 'Make admin'}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                      user.is_admin
                        ? 'bg-primary/20 border border-primary/40 text-primary'
                        : 'bg-card border border-[#273246] text-[#94A3B8] hover:text-primary'
                    }`}
                  >
                    {saving === user.id + '-admin'
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Shield size={13} />
                    }
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteUser(user.id)}
                    disabled={!!saving}
                    title="Remove user"
                    className="w-8 h-8 rounded-lg bg-card border border-[#273246] text-[#94A3B8] hover:text-loss hover:border-loss/40 flex items-center justify-center transition"
                  >
                    {saving === user.id + '-delete'
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Trash2 size={13} />
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#94A3B8]">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}
