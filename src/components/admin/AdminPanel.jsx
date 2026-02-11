import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import SafeSection from '../SafeSection';

export default function AdminPanel({
  theme,
  styles,
  currentUser,
  currentProgramId,
  currentProgram,
  onClose,
  onRoleChange,
}) {
  const t = styles;

  const [adminTab, setAdminTab] = useState('feedback'); // feedback | memberships | invites

  // Feedback
  const [adminFeedback, setAdminFeedback] = useState([]);
  const [adminFeedbackLoading, setAdminFeedbackLoading] = useState(false);
  const [adminFeedbackError, setAdminFeedbackError] = useState(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState(null);

  // Memberships
  const [adminMembers, setAdminMembers] = useState([]);
  const [adminMembersLoading, setAdminMembersLoading] = useState(false);
  const [adminMembersError, setAdminMembersError] = useState(null);

  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberRole, setAddMemberRole] = useState('viewer');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState(null);

  // Invites
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteDays, setInviteDays] = useState(14);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [createdInvite, setCreatedInvite] = useState(null);

  const [redeemToken, setRedeemToken] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState(null);

  const selectedFeedback = useMemo(() => {
    if (!selectedFeedbackId) return null;
    return (adminFeedback || []).find((f) => f.id === selectedFeedbackId) || null;
  }, [adminFeedback, selectedFeedbackId]);

  const getSiteOrigin = () => (typeof window === 'undefined' ? '' : window.location.origin);
  const buildInviteLink = (token) => (!token ? '' : `${getSiteOrigin()}/?invite=${encodeURIComponent(token)}`);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const loadFeedbackForAdmin = async () => {
    try {
      setAdminFeedbackLoading(true);
      setAdminFeedbackError(null);

      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setAdminFeedback(data || []);

      if (selectedFeedbackId && !(data || []).some((f) => f.id === selectedFeedbackId)) {
        setSelectedFeedbackId(null);
      }
    } catch (e) {
      console.error('loadFeedbackForAdmin error:', e);
      setAdminFeedbackError(e?.message || 'Onbekende fout bij laden van feedback');
    } finally {
      setAdminFeedbackLoading(false);
    }
  };

  const loadMembersForAdmin = async () => {
    if (!currentProgramId) {
      setAdminMembers([]);
      return;
    }

    try {
      setAdminMembersLoading(true);
      setAdminMembersError(null);

      const { data: membershipsData, error: membershipsError } = await supabase
        .from('program_memberships')
        .select('id, program_id, user_id, role, created_at')
        .eq('program_id', currentProgramId)
        .order('created_at', { ascending: true });

      if (membershipsError) throw membershipsError;

      const ids = Array.from(new Set((membershipsData || []).map((m) => m.user_id).filter(Boolean)));
      let profilesById = {};

      if (ids.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', ids);

        if (profilesError) throw profilesError;
        profilesById = Object.fromEntries((profilesData || []).map((p) => [p.id, p]));
      }

      const merged = (membershipsData || []).map((m) => ({
        ...m,
        profiles: profilesById[m.user_id] || null,
      }));

      setAdminMembers(merged);
    } catch (e) {
      console.error('loadMembersForAdmin error:', e);
      setAdminMembersError(e?.message || 'Onbekende fout bij laden van members');
    } finally {
      setAdminMembersLoading(false);
    }
  };

  const updateMemberRoleAsAdmin = async (membershipId, nextRole) => {
    if (!membershipId || !nextRole) return;

    try {
      const mine = (adminMembers || []).find((m) => m.id === membershipId) || null;

      const { error } = await supabase
        .from('program_memberships')
        .update({ role: nextRole })
        .eq('id', membershipId);

      if (error) throw error;

      setAdminMembers((prev) => (prev || []).map((m) => (m.id === membershipId ? { ...m, role: nextRole } : m)));

      if (mine?.user_id && currentUser?.id && mine.user_id === currentUser.id) {
        onRoleChange?.(nextRole);
      }
    } catch (e) {
      console.error('updateMemberRoleAsAdmin error:', e);
      alert('Rol wijzigen mislukt: ' + (e?.message || 'Onbekende fout'));
    }
  };

  const removeMemberAsAdmin = async (membershipId) => {
    if (!membershipId) return;
    if (!window.confirm('Lid verwijderen uit dit programma?')) return;

    try {
      const { error } = await supabase.from('program_memberships').delete().eq('id', membershipId);
      if (error) throw error;
      setAdminMembers((prev) => (prev || []).filter((m) => m.id !== membershipId));
    } catch (e) {
      console.error('removeMemberAsAdmin error:', e);
      alert('Verwijderen mislukt: ' + (e?.message || 'Onbekende fout'));
    }
  };

  const findUserByEmailForAdmin = async (email) => {
    const needle = (email || '').trim().toLowerCase();
    if (!needle) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .ilike('email', needle)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  };

  const addMemberByEmailAsAdmin = async () => {
    if (!currentProgramId) {
      alert('Selecteer eerst een programma.');
      return;
    }

    const email = (addMemberEmail || '').trim();
    if (!email) {
      setAddMemberError('Vul een email in.');
      return;
    }

    setAddMemberError(null);

    try {
      setAddMemberLoading(true);

      const profile = await findUserByEmailForAdmin(email);
      if (!profile?.id) {
        throw new Error('Geen user gevonden met deze email. Laat de student eerst registreren / invite verzilveren.');
      }

      if ((adminMembers || []).some((m) => m.user_id === profile.id)) {
        throw new Error('Deze user is al lid van dit programma.');
      }

      const { data: inserted, error } = await supabase
        .from('program_memberships')
        .insert({ program_id: currentProgramId, user_id: profile.id, role: addMemberRole })
        .select('id, program_id, user_id, role, created_at')
        .single();

      if (error) throw error;

      setAdminMembers((prev) => [...(prev || []), { ...inserted, profiles: profile }]);
      setAddMemberEmail('');
      setAddMemberRole('viewer');
    } catch (e) {
      console.error('addMemberByEmailAsAdmin error:', e);
      setAddMemberError(e?.message || 'Onbekende fout');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const createInviteAsAdmin = async () => {
    if (!currentProgramId) {
      setInviteError('Selecteer eerst een programma.');
      return;
    }

    setInviteError(null);
    setCreatedInvite(null);

    try {
      setInviteLoading(true);

      const { data: sessionRes } = await supabase.auth.getSession();
      const accessToken = sessionRes?.session?.access_token;
      if (!accessToken) throw new Error('Geen sessie-token');

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-invite`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          program_id: currentProgramId,
          role: inviteRole,
          expires_in_days: Number(inviteDays),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Invite maken mislukt (${res.status})`);

      setCreatedInvite(json);
    } catch (e) {
      console.error('createInviteAsAdmin error:', e);
      setInviteError(e?.message || 'Onbekende fout');
    } finally {
      setInviteLoading(false);
    }
  };

  const redeemInviteForMe = async (token) => {
    const tkn = (token ?? '').trim();
    if (!tkn) return;

    setRedeemError(null);

    try {
      setRedeemLoading(true);

      const { data: sessionRes } = await supabase.auth.getSession();
      const accessToken = sessionRes?.session?.access_token;
      if (!accessToken) throw new Error('Geen sessie-token');

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redeem-invite`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ invite_token: tkn }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Invite verzilveren mislukt (${res.status})`);

      alert('Invite verzilverd. Programma is toegevoegd. Ververs de pagina om je nieuwe programma te zien.');
    } catch (e) {
      console.error('redeemInviteForMe error:', e);
      setRedeemError(e?.message || 'Onbekende fout');
    } finally {
      setRedeemLoading(false);
    }
  };

  // Auto-load on tab change / program change
  useEffect(() => {
    if (adminTab === 'feedback') loadFeedbackForAdmin();
    if (adminTab === 'memberships') loadMembersForAdmin();
    // invites: no list to load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminTab, currentProgramId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${t.card} rounded-lg shadow-xl w-[min(1400px,96vw)] h-[min(780px,92vh)] mx-2 border ${t.border} overflow-hidden`}>
        <div className={`flex items-center justify-between px-4 py-3 border-b ${t.border}`}>
          <div>
            <div className={`text-lg font-bold ${t.text}`}>Admin console</div>
            <div className={`text-xs ${t.textSecondary}`}>Beheer per programma</div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`text-xs px-2 py-1 rounded border ${t.border} ${t.textSecondary}`}>
              Programma: {currentProgram?.name || '—'}
            </div>

            <div className="hidden md:flex items-center gap-1">
              <button
                className={`${adminTab === 'feedback' ? t.button : t.buttonSecondary} px-3 py-2 rounded text-xs`}
                onClick={() => setAdminTab('feedback')}
              >
                Feedback
              </button>
              <button
                className={`${adminTab === 'memberships' ? t.button : t.buttonSecondary} px-3 py-2 rounded text-xs`}
                onClick={() => setAdminTab('memberships')}
                disabled={!currentProgramId}
                title={!currentProgramId ? 'Selecteer een programma' : 'Memberships'}
              >
                Memberships
              </button>
              <button
                className={`${adminTab === 'invites' ? t.button : t.buttonSecondary} px-3 py-2 rounded text-xs`}
                onClick={() => setAdminTab('invites')}
                disabled={!currentProgramId}
                title={!currentProgramId ? 'Selecteer een programma' : 'Invites'}
              >
                Invites
              </button>
            </div>

            <button onClick={onClose} className={`${t.buttonSecondary} px-3 py-2 rounded text-sm`} title="Sluiten">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="h-full">
          <SafeSection name="admin-panel" title="Admin onderdeel crashte" className="h-full">
            {adminTab === 'feedback' && (
              <div className="grid grid-cols-12 h-full">
                <div className="col-span-12 flex items-center justify-between gap-2 px-4 py-2 border-b">
                  <div className={`text-xs ${t.textSecondary}`}>Feedback (max 200)</div>
                  <button
                    className={`${t.buttonSecondary} px-3 py-2 rounded text-xs`}
                    onClick={loadFeedbackForAdmin}
                    disabled={adminFeedbackLoading}
                  >
                    ↻ Refresh
                  </button>
                </div>

                <div className={`col-span-12 md:col-span-5 border-r ${t.border} overflow-auto`}>
                  <div className={`px-4 py-2 text-xs font-semibold ${t.textSecondary} border-b ${t.border}`}>
                    Ingekomen feedback
                  </div>
                  <div className="divide-y">
                    {adminFeedback.map((f) => (
                      <button
                        key={f.id}
                        className={`w-full text-left px-4 py-3 hover:opacity-90 ${selectedFeedbackId === f.id ? (theme === 'light' ? 'bg-gray-100' : 'bg-gray-700/50') : ''}`}
                        onClick={() => setSelectedFeedbackId(f.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className={`text-xs font-semibold ${t.text}`}>{(f.type || 'suggestion').toUpperCase()}</div>
                          <div className={`text-[11px] ${t.textSecondary}`}>{f.created_at ? new Date(f.created_at).toLocaleString() : ''}</div>
                        </div>
                        <div className={`text-sm mt-1 ${t.text} line-clamp-2`}>{f.message || ''}</div>
                        <div className={`text-[11px] mt-1 ${t.textSecondary}`}>{f.user_email || f.user_id || 'onbekend'}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-12 md:col-span-7 overflow-auto">
                  {!selectedFeedbackId ? (
                    <div className={`p-4 text-sm ${t.textSecondary}`}>Selecteer links een item.</div>
                  ) : !selectedFeedback ? (
                    <div className={`p-4 text-sm ${t.textSecondary}`}>Niet gevonden.</div>
                  ) : (
                    <div className="p-4">
                      {adminFeedbackLoading && <div className={`p-4 text-sm ${t.textSecondary}`}>Laden…</div>}
                      {adminFeedbackError && <div className="p-4 text-sm text-red-500">{adminFeedbackError}</div>}
                      {!adminFeedbackLoading && !adminFeedbackError && (
                        <div>
                          <div className={`text-lg font-bold ${t.text}`}>{(selectedFeedback.type || 'suggestion').toUpperCase()}</div>
                          <div className={`text-xs ${t.textSecondary}`}>{selectedFeedback.created_at ? new Date(selectedFeedback.created_at).toLocaleString() : ''}</div>
                          <div className={`text-xs mt-1 ${t.textSecondary}`}>Van: {selectedFeedback.user_email || selectedFeedback.user_id || 'onbekend'}</div>
                          <div className="mt-4">
                            <div className={`text-sm ${t.text} whitespace-pre-line`}>{selectedFeedback.message || ''}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {adminTab === 'memberships' && (
              <div className="h-full overflow-auto">
                <div className={`px-4 py-3 border-b ${t.border} flex items-center justify-between gap-2`}>
                  <div>
                    <div className={`text-sm font-semibold ${t.text}`}>Memberships</div>
                    <div className={`text-xs ${t.textSecondary}`}>Beheer leden en rollen voor dit programma.</div>
                  </div>
                  <button
                    className={`${t.buttonSecondary} px-3 py-2 rounded text-xs`}
                    onClick={loadMembersForAdmin}
                    disabled={adminMembersLoading}
                  >
                    ↻ Refresh
                  </button>
                </div>

                <div className={`px-4 py-3 border-b ${t.border}`}>
                  <div className={`text-xs font-semibold uppercase tracking-wide ${t.textSecondary}`}>Lid toevoegen</div>
                  <div className="mt-2 grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 md:col-span-6">
                      <label className={`block text-xs mb-1 ${t.textSecondary}`}>Email</label>
                      <input
                        type="email"
                        className={`w-full text-sm px-3 py-2 rounded border ${t.input}`}
                        placeholder="student@school.nl"
                        value={addMemberEmail}
                        onChange={(e) => setAddMemberEmail(e.target.value)}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <label className={`block text-xs mb-1 ${t.textSecondary}`}>Role</label>
                      <select
                        className={`w-full text-sm px-3 py-2 rounded border ${t.input}`}
                        value={addMemberRole}
                        onChange={(e) => setAddMemberRole(e.target.value)}
                      >
                        <option value="viewer">viewer</option>
                        <option value="editor">editor</option>
                        <option value="chief_editor">chief_editor</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <button
                        type="button"
                        className={`${t.button} w-full px-4 py-2 rounded text-sm disabled:opacity-50`}
                        disabled={addMemberLoading}
                        onClick={addMemberByEmailAsAdmin}
                      >
                        {addMemberLoading ? 'Toevoegen…' : 'Toevoegen'}
                      </button>
                    </div>
                    {addMemberError && <div className="col-span-12 text-sm text-red-500">{addMemberError}</div>}
                    <div className={`col-span-12 text-[11px] ${t.textSecondary}`}>
                      Tip: als de gebruiker niet gevonden wordt, laat hem/haar eerst registreren of via een invite-link binnenkomen.
                    </div>
                  </div>
                </div>

                {adminMembersLoading && <div className={`p-4 text-sm ${t.textSecondary}`}>Laden…</div>}
                {adminMembersError && <div className="p-4 text-sm text-red-500">{adminMembersError}</div>}

                {!adminMembersLoading && !adminMembersError && (
                  <div className="p-4">
                    <div className={`text-xs ${t.textSecondary} mb-2`}>Totaal: {adminMembers.length}</div>
                    <div className={`rounded border ${t.border} overflow-hidden`}>
                      <div className={`grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-semibold uppercase ${t.headerBg} ${t.textSecondary}`}>
                        <div className="col-span-5">Naam</div>
                        <div className="col-span-4">Email</div>
                        <div className="col-span-3">Role</div>
                        <div className="col-span-0"></div>
                      </div>
                      <div className={`divide-y ${t.divider}`}>
                        {adminMembers.map((m) => (
                          <div key={m.id} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                            <div className={`col-span-5 text-xs ${t.text}`}>{m.profiles?.name || '—'}</div>
                            <div className={`col-span-4 text-xs ${t.textSecondary}`}>{m.profiles?.email || '—'}</div>
                            <div className="col-span-3">
                              <select
                                className={`w-full text-xs px-2 py-1 rounded border ${t.input}`}
                                value={m.role}
                                onChange={(e) => updateMemberRoleAsAdmin(m.id, e.target.value)}
                              >
                                <option value="viewer">viewer</option>
                                <option value="editor">editor</option>
                                <option value="chief_editor">chief_editor</option>
                                <option value="admin">admin</option>
                              </select>
                            </div>
                            <div className="col-span-12 flex justify-end">
                              <button
                                className="text-[11px] px-2 py-1 rounded border border-red-500 text-red-600 hover:bg-red-50"
                                onClick={() => removeMemberAsAdmin(m.id)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {adminTab === 'invites' && (
              <div className="h-full overflow-auto">
                <div className={`px-4 py-3 border-b ${t.border}`}>
                  <div className={`text-sm font-semibold ${t.text}`}>Invite links</div>
                  <div className={`text-xs ${t.textSecondary}`}>
                    Maak een deelbare link (Teams/WhatsApp) om iemand aan dit programma toe te voegen.
                  </div>
                </div>

                <div className="p-4 grid grid-cols-12 gap-4">
                  <div className={`col-span-12 lg:col-span-6 rounded border ${t.border} p-4`}>
                    <div className={`text-sm font-semibold ${t.text}`}>Nieuwe invite</div>
                    <div className={`text-xs ${t.textSecondary} mt-1`}>Alleen program admins kunnen invites maken.</div>

                    <div className="mt-3 grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-6">
                        <label className={`block text-xs mb-1 ${t.textSecondary}`}>Role</label>
                        <select
                          className={`w-full text-sm px-3 py-2 rounded border ${t.input}`}
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                        >
                          <option value="viewer">viewer</option>
                          <option value="editor">editor</option>
                          <option value="chief_editor">chief_editor</option>
                          <option value="admin">admin</option>
                        </select>
                      </div>
                      <div className="col-span-6">
                        <label className={`block text-xs mb-1 ${t.textSecondary}`}>Geldig (dagen)</label>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          className={`w-full text-sm px-3 py-2 rounded border ${t.input}`}
                          value={inviteDays}
                          onChange={(e) => setInviteDays(Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-12">
                        <button
                          className={`${t.button} px-4 py-2 rounded text-sm disabled:opacity-50`}
                          disabled={inviteLoading}
                          onClick={createInviteAsAdmin}
                        >
                          {inviteLoading ? 'Maken…' : 'Maak invite link'}
                        </button>
                      </div>
                    </div>

                    {inviteError && <div className="mt-3 text-sm text-red-500">{inviteError}</div>}

                    {createdInvite?.invite_token && (
                      <div className={`mt-4 rounded border ${t.border} p-3`}>
                        <div className={`text-xs ${t.textSecondary}`}>Link</div>
                        <div className={`text-sm font-mono break-all ${t.text}`}>{buildInviteLink(createdInvite.invite_token)}</div>
                        <div className="mt-2 flex gap-2">
                          <button
                            className={`${t.buttonSecondary} px-3 py-2 rounded text-xs`}
                            onClick={async () => {
                              const ok = await copyToClipboard(buildInviteLink(createdInvite.invite_token));
                              if (ok) alert('Link gekopieerd');
                            }}
                          >
                            Kopieer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`col-span-12 lg:col-span-6 rounded border ${t.border} p-4`}>
                    <div className={`text-sm font-semibold ${t.text}`}>Invite verzilveren (test)</div>
                    <div className={`text-xs ${t.textSecondary} mt-1`}>Handig om snel te testen met een token.</div>
                    <div className="mt-3 flex gap-2">
                      <input
                        className={`flex-1 text-sm px-3 py-2 rounded border ${t.input}`}
                        placeholder="invite token"
                        value={redeemToken}
                        onChange={(e) => setRedeemToken(e.target.value)}
                      />
                      <button
                        className={`${t.buttonSecondary} px-3 py-2 rounded text-sm disabled:opacity-50`}
                        disabled={redeemLoading}
                        onClick={() => redeemInviteForMe(redeemToken)}
                      >
                        {redeemLoading ? '…' : 'Redeem'}
                      </button>
                    </div>
                    {redeemError && <div className="mt-3 text-sm text-red-500">{redeemError}</div>}
                  </div>
                </div>
              </div>
            )}
          </SafeSection>
        </div>
      </div>
    </div>
  );
}
