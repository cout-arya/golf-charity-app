import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Users, Ticket, Heart, LayoutDashboard, CheckCircle, XCircle, Plus, Pencil, Trash2, Loader2, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  
  const [users, setUsers] = useState([]);
  const [draws, setDraws] = useState([]);
  const [charities, setCharities] = useState([]);
  const [winners, setWinners] = useState([]);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Charity CRUD form
  const [charityForm, setCharityForm] = useState({ name: '', description: '', website: '', featured: false });
  const [editingCharity, setEditingCharity] = useState(null);
  const [showCharityForm, setShowCharityForm] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [usersRes, drawsRes, charitiesRes, winnersRes] = await Promise.all([
      supabase.from('profiles').select('*, subscriptions(plan, status)'),
      supabase.from('draws').select('*').order('created_at', { ascending: false }),
      supabase.from('charities').select('*').order('name'),
      supabase.from('winners').select('*, profiles(full_name, avatar_url), draws(draw_date, numbers)').order('created_at', { ascending: false }),
    ]);
    if (usersRes.data) setUsers(usersRes.data);
    if (drawsRes.data) setDraws(drawsRes.data);
    if (charitiesRes.data) setCharities(charitiesRes.data);
    if (winnersRes.data) setWinners(winnersRes.data);
  };

  // ─── DRAW SIMULATION ───
  const handleSimulateDraw = async (type) => {
    setIsProcessing(true);
    try {
      let numbers = [];
      if (type === 'random') {
        while(numbers.length < 5) {
          let r = Math.floor(Math.random() * 45) + 1;
          if(numbers.indexOf(r) === -1) numbers.push(r);
        }
      } else {
        while(numbers.length < 5) {
          let r = Math.random() < 0.4 ? (Math.floor(Math.random() * 10) + 1) : (Math.floor(Math.random() * 35) + 11);
          if(numbers.indexOf(r) === -1) numbers.push(r);
        }
      }
      numbers.sort((a,b) => a-b);

      const { data: allScores } = await supabase.from('scores').select('user_id, score');
      const userScores = {};
      (allScores || []).forEach(s => {
        if (!userScores[s.user_id]) userScores[s.user_id] = [];
        userScores[s.user_id].push(s.score);
      });

      let match3 = 0, match4 = 0, match5 = 0;
      Object.values(userScores).forEach(uScores => {
        const matches = uScores.filter(num => numbers.includes(num)).length;
        if (matches === 3) match3++;
        if (matches === 4) match4++;
        if (matches === 5) match5++;
      });

      const totalPool = 1200;
      setSimulationResult({
        numbers, type,
        matches: { m3: match3, m4: match4, m5: match5 },
        payouts: {
          m5: match5 > 0 ? ((totalPool * 0.40) / match5).toFixed(2) : 'Rollover',
          m4: match4 > 0 ? ((totalPool * 0.35) / match4).toFixed(2) : '0.00',
          m3: match3 > 0 ? ((totalPool * 0.25) / match3).toFixed(2) : '0.00'
        }
      });
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  const handlePublishDraw = async () => {
    if (!simulationResult) return;
    setIsProcessing(true);
    await supabase.from('draws').insert({
      draw_date: new Date().toISOString(),
      status: 'published',
      draw_type: simulationResult.type,
      numbers: simulationResult.numbers
    });
    setSimulationResult(null);
    fetchData();
    setIsProcessing(false);
  };

  // ─── CHARITY CRUD ───
  const handleSaveCharity = async () => {
    setIsProcessing(true);
    if (editingCharity) {
      await supabase.from('charities').update(charityForm).eq('id', editingCharity);
    } else {
      await supabase.from('charities').insert(charityForm);
    }
    setCharityForm({ name: '', description: '', website: '', featured: false });
    setEditingCharity(null);
    setShowCharityForm(false);
    fetchData();
    setIsProcessing(false);
  };

  const handleDeleteCharity = async (id) => {
    if (!window.confirm('Delete this charity?')) return;
    await supabase.from('charities').delete().eq('id', id);
    fetchData();
  };

  // ─── WINNER VERIFICATION ───
  const handleVerifyWinner = async (winnerId, status) => {
    await supabase.from('winners').update({ verification_status: status }).eq('id', winnerId);
    fetchData();
  };

  const handleMarkPaid = async (winnerId) => {
    await supabase.from('winners').update({ payout_status: 'paid' }).eq('id', winnerId);
    fetchData();
  };

  const chartData = [
    { name: 'Jan', pool: 4000 }, { name: 'Feb', pool: 5500 },
    { name: 'Mar', pool: 7200 }, { name: 'Apr', pool: 8900 },
  ];

  const tabIcons = {
    'Overview': <LayoutDashboard size={18} />,
    'Users': <Users size={18} />,
    'Draws Engine': <Ticket size={18} />,
    'Charities': <Heart size={18} />,
    'Winners': <Trophy size={18} />,
  };
  const tabs = Object.keys(tabIcons);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-color)' }}>
      {/* Sidebar */}
      <aside className="w-64 p-6 flex-col gap-6 hidden md:flex flex-shrink-0"
        style={{ backgroundColor: 'var(--surface-container-lowest)', borderRight: '1px solid var(--outline-variant)' }}>
        <div className="font-display font-bold text-xl mb-8" style={{ color: 'var(--primary)' }}>⛳ ImpactLinks Admin</div>
        <nav className="flex flex-col gap-2">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className="flex items-center gap-3 text-left p-3 rounded-xl font-semibold transition-colors border-none cursor-pointer text-sm"
              style={{
                backgroundColor: activeTab === t ? 'var(--surface-container)' : 'transparent',
                color: activeTab === t ? 'var(--primary)' : 'var(--on-surface-variant)',
              }}>
              {tabIcons[t]} {t}
            </button>
          ))}
        </nav>
        <div className="mt-auto">
          <button onClick={signOut} className="btn btn-secondary w-full text-sm flex items-center gap-2 justify-center"><LogOut size={14} /> Sign Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <span className="label-kicker mb-1 block" style={{ color: 'var(--tertiary)' }}>ADMIN PANEL</span>
            <h1 className="headline-md">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold">{profile?.full_name}</span>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
              style={{ backgroundColor: 'var(--primary-fixed)', color: 'var(--primary)' }}>
              {profile?.full_name?.[0] || 'A'}
            </div>
          </div>
        </div>

        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === 'Overview' && (
          <div className="flex flex-col gap-8">
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { label: 'Total Users', value: users.length, color: 'var(--on-surface)' },
                { label: 'Active Subs', value: users.filter(u => u.subscriptions?.some?.(s => s.status === 'active')).length, color: 'var(--primary)' },
                { label: 'Prize Pool (Est)', value: '£1,200', color: 'var(--tertiary)' },
                { label: 'Charities', value: charities.length, color: 'var(--primary)' },
              ].map((card, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="card-elevated">
                  <div className="text-sm text-muted mb-2 font-semibold">{card.label}</div>
                  <div className="display-lg" style={{ color: card.color }}>{card.value}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="card-elevated md:col-span-2 min-h-[300px]">
                <h2 className="title-md mb-6">Prize Pool Growth</h2>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="var(--on-surface-variant)" />
                      <YAxis stroke="var(--on-surface-variant)" />
                      <Tooltip contentStyle={{
                        backgroundColor: 'var(--surface-container-lowest)',
                        border: '1px solid var(--outline-variant)',
                        borderRadius: '8px',
                        color: 'var(--on-surface)'
                      }} />
                      <Bar dataKey="pool" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card-elevated flex flex-col justify-center text-center">
                <h3 className="title-md mb-4" style={{ color: 'var(--tertiary)' }}>Next Draw</h3>
                <div className="text-4xl font-display font-bold mb-2">12 Days</div>
                <p className="text-sm text-muted mb-6">Scheduled for 1st of next month.</p>
                <button onClick={() => setActiveTab('Draws Engine')} className="btn btn-primary w-full">Go to Draw Engine</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ USERS TAB ═══ */}
        {activeTab === 'Users' && (
          <div className="card-elevated">
            <h2 className="title-md mb-6">All Users ({users.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-muted" style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                    <th className="pb-3 px-2">Name</th>
                    <th className="pb-3 px-2">Role</th>
                    <th className="pb-3 px-2">Subscription</th>
                    <th className="pb-3 px-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="transition-colors"
                      style={{ borderBottom: '1px solid var(--outline-variant)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-container-low)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td className="py-4 px-2 font-semibold">{u.full_name || 'N/A'}</td>
                      <td className="py-4 px-2">
                        <span className="px-2 py-1 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: u.role === 'admin' ? 'var(--tertiary-fixed)' : 'var(--primary-fixed)',
                            color: u.role === 'admin' ? 'var(--tertiary)' : 'var(--primary)',
                          }}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        {u.subscriptions && u.subscriptions.length > 0 ? (
                          <span className="text-xs font-bold"
                            style={{ color: u.subscriptions[0].status === 'active' ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
                            {u.subscriptions[0].plan} · {u.subscriptions[0].status}
                          </span>
                        ) : <span className="text-muted text-xs">None</span>}
                      </td>
                      <td className="py-4 px-2 text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan="4" className="py-8 text-center text-muted">No users yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ DRAWS ENGINE TAB ═══ */}
        {activeTab === 'Draws Engine' && (
          <div className="flex flex-col gap-8">
            <div className="card-elevated">
              <h2 className="title-md mb-6">Draw Simulator</h2>
              <p className="text-sm text-muted mb-8 max-w-2xl">
                Run a simulation to analyze potential payouts before officially publishing the draw.
              </p>
              <div className="flex gap-4 mb-8 flex-wrap">
                <button onClick={() => handleSimulateDraw('random')} disabled={isProcessing}
                  className="btn btn-primary">
                  {isProcessing ? <><Loader2 size={14} className="animate-spin mr-2" /> Running...</> : 'Simulate Random Draw'}
                </button>
                <button onClick={() => handleSimulateDraw('algorithmic')} disabled={isProcessing}
                  className="btn btn-secondary">Simulate Algorithmic Draw</button>
              </div>

              {simulationResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-8 rounded-xl grid md:grid-cols-2 gap-8"
                  style={{ backgroundColor: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
                  <div>
                    <div className="label-kicker mb-2">Generated Numbers ({simulationResult.type})</div>
                    <div className="flex gap-3 mb-8">
                      {simulationResult.numbers.map((n, i) => (
                        <div key={i} className="w-12 h-12 font-display font-bold text-xl rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'var(--primary-fixed)', color: 'var(--primary)', border: '2px solid var(--primary)' }}>
                          {n}
                        </div>
                      ))}
                    </div>
                    <div className="label-kicker mb-4">Payout Analysis</div>
                    <div className="flex flex-col gap-3">
                      {[
                        { label: '5-Match', icon: <Trophy size={14} />, m: simulationResult.matches.m5, p: simulationResult.payouts.m5, color: 'var(--tertiary)' },
                        { label: '4-Match', m: simulationResult.matches.m4, p: simulationResult.payouts.m4, color: 'var(--on-surface)' },
                        { label: '3-Match', m: simulationResult.matches.m3, p: simulationResult.payouts.m3, color: 'var(--on-surface)' },
                      ].map((tier, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-lg"
                          style={{ backgroundColor: 'var(--surface-container)' }}>
                          <span className="font-bold flex items-center gap-2" style={{ color: tier.color }}>{tier.label} {tier.icon}</span>
                          <span>{tier.m} Winners</span>
                          <span className="font-bold">{tier.p === 'Rollover' ? 'Rolls Over' : `£${tier.p} ea`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center items-center text-center"
                    style={{ borderLeft: '1px solid var(--outline-variant)', paddingLeft: '2rem' }}>
                    <h3 className="headline-md mb-4" style={{ color: 'var(--error)' }}>Warning</h3>
                    <p className="text-sm text-muted mb-8 max-w-sm">Publishing this draw will finalize these numbers. This cannot be undone.</p>
                    <button onClick={handlePublishDraw} disabled={isProcessing}
                      className="btn" style={{ backgroundColor: 'var(--error)', color: '#fff' }}>
                      {isProcessing ? 'Publishing...' : 'Publish Official Draw'}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="card-elevated">
              <h2 className="title-md mb-6">Draw History</h2>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-muted" style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                    <th className="pb-3 px-2">Date</th><th className="pb-3 px-2">Type</th>
                    <th className="pb-3 px-2">Numbers</th><th className="pb-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {draws.map(d => (
                    <tr key={d.id} className="transition-colors"
                      style={{ borderBottom: '1px solid var(--outline-variant)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-container-low)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td className="py-4 px-2">{new Date(d.draw_date).toLocaleDateString()}</td>
                      <td className="py-4 px-2 capitalize">{d.draw_type}</td>
                      <td className="py-4 px-2 font-mono font-bold" style={{ color: 'var(--primary)' }}>{d.numbers?.join(' - ')}</td>
                      <td className="py-4 px-2">
                        <span className="px-2 py-1 rounded text-xs font-bold"
                          style={{
                            backgroundColor: d.status === 'published' ? 'var(--primary-fixed)' : 'var(--surface-container-high)',
                            color: d.status === 'published' ? 'var(--primary)' : 'var(--on-surface-variant)',
                          }}>
                          {d.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {draws.length === 0 && <tr><td colSpan="4" className="py-8 text-center text-muted">No draws yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ CHARITIES TAB ═══ */}
        {activeTab === 'Charities' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="title-md">Manage Charities ({charities.length})</h2>
              <button onClick={() => { setShowCharityForm(true); setEditingCharity(null); setCharityForm({ name: '', description: '', website: '', featured: false }); }}
                className="btn btn-primary text-sm flex items-center gap-2"><Plus size={16} /> Add Charity</button>
            </div>

            <AnimatePresence>
              {showCharityForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="card-elevated overflow-hidden" style={{ border: '2px solid var(--primary)' }}>
                  <h3 className="title-md mb-4">{editingCharity ? 'Edit Charity' : 'Add New Charity'}</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-semibold text-muted block mb-1">Name</label>
                      <input className="input-field" value={charityForm.name} onChange={e => setCharityForm({ ...charityForm, name: e.target.value })} placeholder="Charity name" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-muted block mb-1">Website</label>
                      <input className="input-field" value={charityForm.website} onChange={e => setCharityForm({ ...charityForm, website: e.target.value })} placeholder="https://..." />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="text-sm font-semibold text-muted block mb-1">Description</label>
                    <textarea className="input-field min-h-[80px]" value={charityForm.description}
                      onChange={e => setCharityForm({ ...charityForm, description: e.target.value })} placeholder="Describe the charity..." />
                  </div>
                  <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
                    <input type="checkbox" checked={charityForm.featured} onChange={e => setCharityForm({ ...charityForm, featured: e.target.checked })} />
                    Featured charity
                  </label>
                  <div className="flex gap-3">
                    <button onClick={handleSaveCharity} disabled={isProcessing || !charityForm.name} className="btn btn-primary text-sm">
                      {isProcessing ? 'Saving...' : 'Save Charity'}
                    </button>
                    <button onClick={() => setShowCharityForm(false)} className="btn btn-secondary text-sm">Cancel</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="card-elevated">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-muted" style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                    <th className="pb-3 px-2">Name</th><th className="pb-3 px-2">Featured</th>
                    <th className="pb-3 px-2">Website</th><th className="pb-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {charities.map(c => (
                    <tr key={c.id} className="transition-colors"
                      style={{ borderBottom: '1px solid var(--outline-variant)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-container-low)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td className="py-4 px-2 font-semibold">{c.name}</td>
                      <td className="py-4 px-2">{c.featured
                        ? <span className="font-bold text-xs" style={{ color: 'var(--tertiary)' }}>★ Yes</span>
                        : <span className="text-muted text-xs">No</span>}</td>
                      <td className="py-4 px-2 text-xs" style={{ color: 'var(--primary)' }}>{c.website || '—'}</td>
                      <td className="py-4 px-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => { setCharityForm({ name: c.name, description: c.description, website: c.website || '', featured: c.featured }); setEditingCharity(c.id); setShowCharityForm(true); }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                            style={{ backgroundColor: 'var(--surface-container-high)' }}><Pencil size={14} /></button>
                          <button onClick={() => handleDeleteCharity(c.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                            style={{ backgroundColor: 'var(--error-container)', color: 'var(--error)' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {charities.length === 0 && <tr><td colSpan="4" className="py-8 text-center text-muted">No charities yet. Add one above!</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ WINNERS TAB ═══ */}
        {activeTab === 'Winners' && (
          <div className="flex flex-col gap-6">
            <h2 className="title-md">Winner Verification & Payouts ({winners.length})</h2>
            {winners.map(w => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="card-elevated flex flex-col md:flex-row items-start md:items-center gap-6"
                style={{ border: '1px solid var(--outline-variant)' }}>
                <div className="flex-1">
                  <div className="font-semibold text-lg">{w.profiles?.full_name || 'Unknown User'}</div>
                  <div className="text-sm text-muted">
                    {w.match_type}-Match · £{parseFloat(w.prize_amount).toFixed(2)} · Draw: {w.draws?.draw_date ? new Date(w.draws.draw_date).toLocaleDateString() : 'N/A'}
                  </div>
                  {w.proof_url && (
                    <a href={w.proof_url} target="_blank" rel="noopener noreferrer"
                      className="text-sm hover:underline mt-1 block" style={{ color: 'var(--primary)' }}>View Proof Upload →</a>
                  )}
                  {!w.proof_url && <div className="text-xs mt-1" style={{ color: 'var(--tertiary)' }}>No proof submitted yet</div>}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Verification Status */}
                  <div className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: w.verification_status === 'approved' ? 'var(--primary-fixed)'
                        : w.verification_status === 'rejected' ? 'var(--error-container)'
                        : 'var(--tertiary-fixed)',
                      color: w.verification_status === 'approved' ? 'var(--primary)'
                        : w.verification_status === 'rejected' ? 'var(--error)'
                        : 'var(--tertiary)',
                    }}>
                    {w.verification_status?.toUpperCase()}
                  </div>

                  {w.verification_status === 'pending' && (
                    <>
                      <button onClick={() => handleVerifyWinner(w.id, 'approved')}
                        className="btn btn-primary text-xs flex items-center gap-1 py-1 px-3"><CheckCircle size={14} /> Approve</button>
                      <button onClick={() => handleVerifyWinner(w.id, 'rejected')}
                        className="btn btn-secondary text-xs flex items-center gap-1 py-1 px-3"
                        style={{ color: 'var(--error)' }}><XCircle size={14} /> Reject</button>
                    </>
                  )}

                  {/* Payout Status */}
                  {w.verification_status === 'approved' && w.payout_status !== 'paid' && (
                    <button onClick={() => handleMarkPaid(w.id)}
                      className="btn text-xs py-1 px-3"
                      style={{ background: 'linear-gradient(135deg, var(--tertiary), var(--tertiary-container))', color: '#ffffff' }}>
                      Mark as Paid
                    </button>
                  )}

                  {w.payout_status === 'paid' && (
                    <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>✓ PAID</span>
                  )}
                </div>
              </motion.div>
            ))}
            {winners.length === 0 && (
              <div className="card-elevated text-center text-muted py-12">No winners recorded yet. Run a draw first!</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
