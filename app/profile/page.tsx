'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  UserCircle, Camera, Check, Loader2, LogOut,
  Mail, KeyRound, ChevronLeft, Pencil, X,
  ShieldCheck, ShieldOff, QrCode, AtSign
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user,             setUser]             = useState<SupabaseUser | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);
  const [uploadingAvatar,  setUploadingAvatar]  = useState(false);
  const [success,          setSuccess]          = useState('');
  const [error,            setError]            = useState('');

  // Profile fields
  const [displayName,     setDisplayName]     = useState('');
  const [avatarUrl,       setAvatarUrl]       = useState('');
  const [editingName,     setEditingName]     = useState(false);
  const [username,        setUsername]        = useState('');
  const [usernameInput,   setUsernameInput]   = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameSaving,  setUsernameSaving]  = useState(false);

  // Password change
  const [showPwForm,  setShowPwForm]  = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [pwSaving,    setPwSaving]    = useState(false);

  // 2FA
  const [mfaFactors,    setMfaFactors]    = useState<any[]>([]);
  const [mfaEnrolling,  setMfaEnrolling]  = useState(false);
  const [mfaQr,         setMfaQr]         = useState<string | null>(null);
  const [mfaSecret,     setMfaSecret]     = useState<string | null>(null);
  const [mfaFactorId,   setMfaFactorId]   = useState<string | null>(null);
  const [mfaCode,       setMfaCode]       = useState('');
  const [mfaLoading,    setMfaLoading]    = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      setUser(user);
      setDisplayName(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '');
      setAvatarUrl(user.user_metadata?.avatar_url ?? '');
      // Load profile (username)
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();
      if (profile) { setUsername(profile.username); setUsernameInput(profile.username); }
      // Load MFA factors
      const { data: factors } = await supabase.auth.mfa.listFactors();
      setMfaFactors(factors?.totp ?? []);
      setLoading(false);
    }
    init();
  }, []);

  async function saveUsername() {
    const val = usernameInput.toLowerCase().trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(val)) return;
    if (val === username) { setEditingUsername(false); return; }
    setUsernameSaving(true);
    setError('');
    const { data: existing } = await supabase
      .from('profiles').select('id').eq('username', val).maybeSingle();
    if (existing) { setError('Username já em uso.'); setUsernameSaving(false); return; }
    const { error } = await supabase.from('profiles')
      .update({ username: val, updated_at: new Date().toISOString() })
      .eq('id', user!.id);
    if (error) setError(error.message);
    else { setUsername(val); setSuccess('Username atualizado!'); setEditingUsername(false); }
    setUsernameSaving(false);
    setTimeout(() => setSuccess(''), 3000);
  }

  async function saveName() {
    if (!displayName.trim()) return;
    setSaving(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ data: { full_name: displayName.trim() } });
    if (error) setError(error.message);
    else { setSuccess('Name updated!'); setEditingName(false); }
    setSaving(false);
    setTimeout(() => setSuccess(''), 3000);
  }

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    setError('');
    const ext  = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadErr) {
      setError(`Upload falhou: ${uploadErr.message}. Crie o bucket "avatars" no Supabase Storage.`);
      setUploadingAvatar(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error: updateErr } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    if (updateErr) setError(updateErr.message);
    else { setAvatarUrl(publicUrl); setSuccess('Foto atualizada!'); }
    setUploadingAvatar(false);
    setTimeout(() => setSuccess(''), 3000);
  }

  async function removeAvatar() {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { avatar_url: null } });
    if (error) setError(error.message);
    else { setAvatarUrl(''); setSuccess('Foto removida.'); }
    setSaving(false);
    setTimeout(() => setSuccess(''), 3000);
  }

  async function changePassword() {
    if (newPassword.length < 6) { setError('Mínimo 6 caracteres.'); return; }
    if (newPassword !== confirmPw) { setError('Senhas não coincidem.'); return; }
    setPwSaving(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setError(error.message);
    else { setSuccess('Senha alterada!'); setShowPwForm(false); setNewPassword(''); setConfirmPw(''); }
    setPwSaving(false);
    setTimeout(() => setSuccess(''), 3000);
  }

  /* ── 2FA enroll ── */
  async function startMfaEnroll() {
    setMfaLoading(true);
    setError('');
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) { setError(error.message); setMfaLoading(false); return; }
    setMfaQr(data.totp.qr_code);
    setMfaSecret(data.totp.secret);
    setMfaFactorId(data.id);
    setMfaEnrolling(true);
    setMfaLoading(false);
  }

  async function confirmMfaEnroll() {
    if (!mfaFactorId || mfaCode.length < 6) return;
    setMfaLoading(true);
    setError('');
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfaFactorId, code: mfaCode });
    if (error) { setError('Código inválido.'); setMfaLoading(false); return; }
    setMfaEnrolling(false);
    setMfaQr(null);
    setMfaSecret(null);
    setMfaCode('');
    setSuccess('2FA ativado com sucesso!');
    const { data: factors } = await supabase.auth.mfa.listFactors();
    setMfaFactors(factors?.totp ?? []);
    setMfaLoading(false);
    setTimeout(() => setSuccess(''), 4000);
  }

  async function disableMfa(factorId: string) {
    if (!confirm('Desativar autenticação de dois fatores?')) return;
    setMfaLoading(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) { setError(error.message); setMfaLoading(false); return; }
    setMfaFactors(prev => prev.filter(f => f.id !== factorId));
    setSuccess('2FA desativado.');
    setMfaLoading(false);
    setTimeout(() => setSuccess(''), 3000);
  }

  async function cancelEnroll() {
    if (mfaFactorId) await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
    setMfaEnrolling(false);
    setMfaQr(null);
    setMfaSecret(null);
    setMfaFactorId(null);
    setMfaCode('');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={36} />
    </div>
  );

  const initials    = displayName.charAt(0).toUpperCase() || '?';
  const mfaEnabled  = mfaFactors.some(f => f.status === 'verified');

  return (
    <div className="min-h-screen bg-background text-[#F1F5F9]">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-card border border-[#273246] flex items-center justify-center hover:border-primary/40 transition">
          <ChevronLeft size={18} className="text-[#94A3B8]" />
        </button>
        <div>
          <h1 className="text-xl font-heading font-bold">Meu Perfil</h1>
          <p className="text-xs text-[#94A3B8]">{user?.email}</p>
        </div>
      </div>

      <div className="px-4 space-y-5 pb-8">

        {/* Feedback */}
        {success && (
          <div className="flex items-center gap-2 bg-win/10 border border-win/30 text-win text-sm font-semibold px-4 py-3 rounded-xl">
            <Check size={15} /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-loss/10 border border-loss/30 text-loss text-sm px-4 py-3 rounded-xl">
            <X size={15} /> {error}
          </div>
        )}

        {/* Avatar */}
        <div className="bg-card border border-[#273246] rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-2 border-primary/40 overflow-hidden bg-muted flex items-center justify-center ring-4 ring-background">
              {avatarUrl
                ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                : <span className="text-4xl font-bold text-primary">{initials}</span>
              }
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary hover:bg-primary-dark rounded-full flex items-center justify-center shadow-lg transition"
            >
              {uploadingAvatar
                ? <Loader2 size={14} className="animate-spin text-white" />
                : <Camera size={14} className="text-white" />
              }
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
          </div>
          <div className="text-center">
            <p className="font-heading font-bold text-lg">{displayName}</p>
            <p className="text-xs text-[#94A3B8]">{user?.email}</p>
          </div>
          {avatarUrl && (
            <button onClick={removeAvatar} className="text-xs text-[#94A3B8] hover:text-loss transition underline">
              Remover foto
            </button>
          )}
          <p className="text-[10px] text-[#94A3B8] text-center leading-relaxed">
            Requer o bucket <span className="text-primary font-semibold">avatars</span> no Supabase Storage.
          </p>
        </div>

        {/* Username */}
        <div className="bg-card border border-[#273246] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Username</p>
            {!editingUsername && (
              <button onClick={() => { setEditingUsername(true); setUsernameInput(username); }}
                className="flex items-center gap-1 text-xs text-primary font-semibold">
                <Pencil size={12} /> Editar
              </button>
            )}
          </div>
          {editingUsername ? (
            <div className="space-y-3">
              <div className="relative">
                <AtSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text" value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                  onKeyDown={e => { if (e.key === 'Enter') saveUsername(); if (e.key === 'Escape') setEditingUsername(false); }}
                  autoFocus maxLength={20}
                  className="w-full bg-background border border-primary/50 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
                />
              </div>
              {usernameInput.length > 0 && !/^[a-zA-Z0-9_]{3,20}$/.test(usernameInput) && (
                <p className="text-xs text-[#94A3B8] px-1">Mínimo 3 caracteres, apenas letras/números/_</p>
              )}
              <div className="flex gap-2">
                <button onClick={saveUsername} disabled={usernameSaving || !/^[a-zA-Z0-9_]{3,20}$/.test(usernameInput)}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-50">
                  {usernameSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Salvar
                </button>
                <button onClick={() => setEditingUsername(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#273246] text-sm text-[#94A3B8] hover:text-white transition">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                <AtSign size={15} className="text-accent" />
              </div>
              <p className="font-mono font-semibold text-accent">@{username || '—'}</p>
            </div>
          )}
        </div>

        {/* Display name */}
        <div className="bg-card border border-[#273246] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Nome</p>
            {!editingName && (
              <button onClick={() => setEditingName(true)} className="flex items-center gap-1 text-xs text-primary font-semibold">
                <Pencil size={12} /> Editar
              </button>
            )}
          </div>
          {editingName ? (
            <div className="space-y-3">
              <input
                type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                autoFocus maxLength={30} placeholder="Seu nome"
                className="w-full bg-background border border-primary/50 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
              />
              <div className="flex gap-2">
                <button onClick={saveName} disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Salvar
                </button>
                <button onClick={() => setEditingName(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#273246] text-sm text-[#94A3B8] hover:text-white transition">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{initials}</span>
              </div>
              <p className="font-semibold">{displayName || '—'}</p>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="bg-card border border-[#273246] rounded-2xl p-5">
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-3">E-mail</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-chart-5/10 border border-chart-5/20 flex items-center justify-center">
              <Mail size={15} className="text-chart-5" />
            </div>
            <p className="text-sm text-[#94A3B8]">{user?.email}</p>
          </div>
        </div>

        {/* Password */}
        <div className="bg-card border border-[#273246] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-chart-4/10 border border-chart-4/20 flex items-center justify-center">
                <KeyRound size={15} className="text-chart-4" />
              </div>
              <p className="font-semibold text-sm">Senha</p>
            </div>
            <button onClick={() => setShowPwForm(!showPwForm)} className="text-xs font-semibold text-primary">
              {showPwForm ? 'Cancelar' : 'Alterar'}
            </button>
          </div>
          {showPwForm && (
            <div className="space-y-3 pt-1">
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Nova senha (mín. 6 caracteres)"
                className="w-full bg-background border border-[#273246] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition placeholder:text-[#94A3B8]"
              />
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') changePassword(); }}
                placeholder="Confirmar nova senha"
                className="w-full bg-background border border-[#273246] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition placeholder:text-[#94A3B8]"
              />
              <button onClick={changePassword} disabled={pwSaving}
                className="w-full bg-chart-4 hover:bg-chart-4/90 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-chart-4/20">
                {pwSaving ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                Salvar senha
              </button>
            </div>
          )}
        </div>

        {/* ── 2FA ── */}
        <div className="bg-card border border-[#273246] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                mfaEnabled ? 'bg-win/10 border-win/20' : 'bg-[#273246] border-[#273246]'
              }`}>
                {mfaEnabled
                  ? <ShieldCheck size={16} className="text-win" />
                  : <ShieldOff   size={16} className="text-[#94A3B8]" />
                }
              </div>
              <div>
                <p className="font-semibold text-sm">Autenticação 2FA</p>
                <p className={`text-xs ${mfaEnabled ? 'text-win' : 'text-[#94A3B8]'}`}>
                  {mfaEnabled ? '✓ Ativado' : 'Desativado'}
                </p>
              </div>
            </div>
            {!mfaEnrolling && !mfaEnabled && (
              <button
                onClick={startMfaEnroll}
                disabled={mfaLoading}
                className="text-xs font-bold bg-primary/10 text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition"
              >
                {mfaLoading ? <Loader2 size={12} className="animate-spin" /> : 'Ativar'}
              </button>
            )}
            {!mfaEnrolling && mfaEnabled && (
              <button
                onClick={() => disableMfa(mfaFactors.find(f => f.status === 'verified')?.id)}
                disabled={mfaLoading}
                className="text-xs font-bold text-loss border border-loss/30 px-3 py-1.5 rounded-lg hover:bg-loss/10 transition"
              >
                Desativar
              </button>
            )}
          </div>

          {/* Enrollment flow */}
          {mfaEnrolling && mfaQr && (
            <div className="space-y-4 pt-1">
              <div className="bg-white p-3 rounded-xl w-fit mx-auto">
                <img src={mfaQr} alt="QR Code 2FA" className="w-48 h-48 block" />
              </div>

              <div className="bg-background/50 rounded-xl p-3 border border-[#273246] space-y-1">
                <p className="text-xs text-[#94A3B8] uppercase font-bold tracking-wider">Chave manual</p>
                <p className="font-mono text-xs text-white break-all select-all">{mfaSecret}</p>
              </div>

              <p className="text-xs text-[#94A3B8] text-center leading-relaxed">
                Escaneie o QR Code com <span className="text-white font-semibold">Google Authenticator</span>, <span className="text-white font-semibold">Authy</span> ou similar. Depois, confirme com o código gerado.
              </p>

              <input
                type="text" inputMode="numeric" maxLength={6}
                value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Código de 6 dígitos"
                autoFocus
                className="w-full bg-background border border-[#273246] rounded-xl px-4 py-3 text-white text-center text-xl font-mono tracking-[0.3em] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition placeholder:text-[#94A3B8]/40 placeholder:text-sm placeholder:tracking-normal"
              />

              <div className="flex gap-2">
                <button
                  onClick={confirmMfaEnroll}
                  disabled={mfaLoading || mfaCode.length < 6}
                  className="flex-1 bg-win hover:bg-win/90 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-40"
                >
                  {mfaLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Confirmar
                </button>
                <button onClick={cancelEnroll}
                  className="px-4 py-2.5 rounded-xl border border-[#273246] text-sm text-[#94A3B8] hover:text-white transition">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Account info */}
        <div className="bg-card border border-[#273246] rounded-2xl p-5">
          <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest mb-3">Conta</p>
          <div className="space-y-2 text-sm text-[#94A3B8]">
            <div className="flex justify-between">
              <span>Membro desde</span>
              <span className="text-white font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>User ID</span>
              <span className="text-white font-mono text-xs">{user?.id?.slice(0, 8)}…</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-loss/10 hover:bg-loss/20 border border-loss/30 text-loss font-bold py-3.5 rounded-xl transition"
        >
          <LogOut size={16} /> Sair da conta
        </button>
      </div>
    </div>
  );
}
