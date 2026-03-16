'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck, Info, Zap, AlertTriangle, UserPlus, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  title: string;
  body: string | null;
  type: 'info' | 'success' | 'warning' | 'friend_request';
  read: boolean;
  link: string | null;
  created_at: string;
}

const typeConfig = {
  info:           { icon: Info,        color: 'text-primary',  bg: 'bg-primary/10' },
  success:        { icon: Zap,         color: 'text-win',      bg: 'bg-win/10' },
  warning:        { icon: AlertTriangle,color: 'text-draw',    bg: 'bg-draw/10' },
  friend_request: { icon: UserPlus,    color: 'text-accent',   bg: 'bg-accent/10' },
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [notes, setNotes]     = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notes.filter(n => !n.read).length;

  useEffect(() => {
    loadNotifications();

    // Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, payload => {
        setNotes(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  async function loadNotifications() {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotes(data as Notification[]);
    setLoading(false);
  }

  async function markAllRead() {
    const unreadIds = notes.filter(n => !n.read).map(n => n.id);
    if (!unreadIds.length) return;
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    setNotes(n => n.map(x => ({ ...x, read: true })));
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotes(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  }

  async function dismiss(id: string) {
    await supabase.from('notifications').delete().eq('id', id);
    setNotes(n => n.filter(x => x.id !== id));
  }

  function handleClick(note: Notification) {
    markRead(note.id);
    if (note.link) router.push(note.link);
    setOpen(false);
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 rounded-xl bg-card border border-[#273246] flex items-center justify-center hover:border-primary/40 transition"
      >
        <Bell size={16} className={unread > 0 ? 'text-primary' : 'text-[#94A3B8]'} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-[#141A25] border border-[#273246] rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#273246]">
            <h3 className="font-heading font-bold text-sm">Notifications</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[10px] font-semibold text-primary flex items-center gap-1 hover:opacity-80 transition">
                <CheckCheck size={11} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-[#94A3B8] text-sm">Loading...</div>
            ) : notes.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Bell size={24} className="mx-auto text-[#273246]" />
                <p className="text-sm text-[#94A3B8]">No notifications yet</p>
              </div>
            ) : (
              notes.map(note => {
                const cfg = typeConfig[note.type] ?? typeConfig.info;
                const Icon = cfg.icon;
                return (
                  <div
                    key={note.id}
                    className={`flex gap-3 px-4 py-3 border-b border-[#273246]/50 cursor-pointer hover:bg-[#1a2333] transition group ${!note.read ? 'bg-primary/5' : ''}`}
                    onClick={() => handleClick(note)}
                  >
                    <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon size={14} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold leading-snug ${note.read ? 'text-[#94A3B8]' : 'text-white'}`}>
                          {note.title}
                        </p>
                        <button
                          onClick={e => { e.stopPropagation(); dismiss(note.id); }}
                          className="opacity-0 group-hover:opacity-100 text-[#475569] hover:text-white transition flex-shrink-0 mt-0.5"
                        >
                          <X size={11} />
                        </button>
                      </div>
                      {note.body && <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">{note.body}</p>}
                      <p className="text-[10px] text-[#475569] mt-1">{timeAgo(note.created_at)}</p>
                    </div>
                    {!note.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
