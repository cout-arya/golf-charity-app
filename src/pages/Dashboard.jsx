import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Trophy, Target, Heart, CalendarDays, Upload, Loader2, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const { user, profile, subscription, signOut, refreshProfile, refreshSubscription } = useAuth();
  const [scores, setScores] = useState([]);
  const [newScore, setNewScore] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [winners, setWinners] = useState([]);
  const [charityPercentage, setCharityPercentage] = useState(profile?.charity_percentage || 10);
  const [savingPercentage, setSavingPercentage] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(null);
  const [charityName, setCharityName] = useState(null);

  const fetchScores = useCallback(async () => {
    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('played_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setScores(data);
  }, [user.id]);

  const fetchWinners = useCallback(async () => {
    const { data } = await supabase
      .from('winners')
      .select('*, draws(draw_date, numbers)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setWinners(data);
  }, [user.id]);

  const fetchCharity = useCallback(async () => {
    if (profile?.charity_id) {
      const { data } = await supabase
        .from('charities')
        .select('name')
        .eq('id', profile.charity_id)
        .single();
      if (data) setCharityName(data.name);
    }
  }, [profile?.charity_id]);

  useEffect(() => {
    if (user) {
      fetchScores();
      fetchWinners();
      refreshSubscription();
      fetchCharity();
    }
  }, [user, fetchScores, fetchWinners, fetchCharity, refreshSubscription]);

  useEffect(() => {
    setCharityPercentage(profile?.charity_percentage || 10);
  }, [profile?.charity_percentage]);

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    if (!newScore || !newDate) return;
    const scoreVal = parseInt(newScore, 10);
    if (scoreVal < 1 || scoreVal > 45) {
      alert('Score must be between 1 and 45.');
      return;
    }
    setIsSubmitting(true);

    const { count } = await supabase
      .from('scores')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count >= 5) {
      const { data: oldestScores } = await supabase
        .from('scores')
        .select('id')
        .eq('user_id', user.id)
        .order('played_date', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1);
      if (oldestScores?.length > 0) {
        await supabase.from('scores').delete().eq('id', oldestScores[0].id);
      }
    }

    await supabase.from('scores').insert({
      user_id: user.id,
      score: scoreVal,
      played_date: newDate
    });

    setNewScore('');
    await fetchScores();
    setIsSubmitting(false);
  };

  const handlePercentageChange = async (newPct) => {
    if (newPct < 10 || newPct > 100) return;
    setSavingPercentage(true);
    setCharityPercentage(newPct);
    await supabase.from('profiles').update({ charity_percentage: newPct }).eq('id', user.id);
    await refreshProfile();
    setSavingPercentage(false);
  };

  const handleProofUpload = async (winnerId, file) => {
    setUploadingProof(winnerId);
    const filePath = `proofs/${user.id}/${winnerId}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('winner-proofs')
      .upload(filePath, file);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('winner-proofs').getPublicUrl(filePath);
      await supabase.from('winners').update({
        proof_url: publicUrl,
        verification_status: 'pending'
      }).eq('id', winnerId);
      await fetchWinners();
    } else {
      alert('Upload failed: ' + uploadError.message);
    }
    setUploadingProof(null);
  };

  const subStatus = subscription?.status || 'inactive';
  const isActive = subStatus === 'active';
  const totalWon = winners.reduce((sum, w) => sum + (w.payout_status === 'paid' ? parseFloat(w.prize_amount) : 0), 0);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4" style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <div className="flex justify-between items-center mb-12">
        <div>
          <span className="label-kicker mb-1 block" style={{ color: 'var(--tertiary)' }}>DASHBOARD</span>
          <h1 className="headline-md">Welcome back, {profile?.full_name?.split(' ')[0] || 'Golfer'}</h1>
          <p className="text-sm text-muted mt-1">Your ImpactLinks Dashboard</p>
        </div>
        <button onClick={signOut} className="btn btn-secondary flex items-center gap-2">
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Column */}
        <div className="flex flex-col gap-6 md:col-span-2">

          {/* Subscription Status */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-elevated">
            <div className="flex items-center gap-3 mb-4">
              <CalendarDays size={20} style={{ color: 'var(--primary)' }} />
              <h2 className="title-md">Subscription Status</h2>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--surface-container-low)' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold capitalize">{subscription?.plan || 'No'} Plan</span>
                <span className={`font-bold px-3 py-1 rounded-full text-xs`}
                  style={{
                    backgroundColor: isActive ? 'var(--primary-fixed)' : 'var(--error-container)',
                    color: isActive ? 'var(--primary)' : 'var(--error)'
                  }}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {subscription?.current_period_end && (
                <div className="text-sm text-muted">Renews: {new Date(subscription.current_period_end).toLocaleDateString()}</div>
              )}
              {!isActive && (
                <Link to="/subscribe" className="btn btn-primary mt-4 text-sm">Subscribe Now</Link>
              )}
            </div>
          </motion.div>

          {/* Score Entry */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-elevated">
            <div className="flex items-center gap-3 mb-4">
              <Target size={20} style={{ color: 'var(--primary)' }} />
              <h2 className="title-md" style={{ color: 'var(--primary)' }}>Recent Scores</h2>
            </div>
            <form onSubmit={handleScoreSubmit} className="flex gap-4 mb-6 items-end flex-wrap">
              <div className="flex flex-col gap-2 flex-grow min-w-[120px]">
                <label className="text-sm font-semibold text-muted">Score (1-45)</label>
                <input type="number" min="1" max="45" required value={newScore}
                  onChange={(e) => setNewScore(e.target.value)} className="input-field" placeholder="e.g. 36" />
              </div>
              <div className="flex flex-col gap-2 flex-grow min-w-[140px]">
                <label className="text-sm font-semibold text-muted">Date Played</label>
                <input type="date" required value={newDate}
                  onChange={(e) => setNewDate(e.target.value)} className="input-field" />
              </div>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary min-h-[48px]">
                {isSubmitting ? 'Saving...' : 'Submit Round'}
              </button>
            </form>

            <AnimatePresence>
              {scores.length === 0 ? (
                <div className="text-muted p-4 rounded-xl text-center"
                  style={{ backgroundColor: 'var(--surface-container-low)' }}>
                  No rounds tracked yet. Add your first score above.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {scores.map((s, idx) => (
                    <motion.div key={s.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex justify-between items-center p-4 rounded-xl"
                      style={{ backgroundColor: 'var(--surface-container-low)' }}>
                      <div>
                        <div className="font-semibold text-lg">{s.score} pts</div>
                        <div className="text-sm text-muted">{new Date(s.played_date).toLocaleDateString()}</div>
                      </div>
                      {idx === 0 && <div className="text-xs px-2 py-1 rounded-full font-bold"
                        style={{ backgroundColor: 'var(--primary)', color: '#ffffff' }}>LATEST</div>}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
            <p className="text-xs text-muted mt-4">Only your latest 5 rounds are kept to determine your active draw numbers.</p>
          </motion.div>
        </div>

        {/* Sidebar Column */}
        <div className="flex flex-col gap-6">
          {/* Impact Winnings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-elevated">
            <div className="flex items-center gap-3 mb-4">
              <Trophy size={20} style={{ color: 'var(--tertiary)' }} />
              <h2 className="title-md" style={{ color: 'var(--tertiary)' }}>Impact Winnings</h2>
            </div>
            <div className="display-lg" style={{ color: 'var(--tertiary)' }}>£{totalWon.toFixed(2)}</div>
            {winners.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                {winners.map(w => (
                  <div key={w.id} className="p-3 rounded-lg text-sm"
                    style={{ backgroundColor: 'var(--surface-container-low)' }}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{w.match_type}-Match · £{parseFloat(w.prize_amount).toFixed(2)}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full`}
                        style={{
                          backgroundColor: w.payout_status === 'paid' ? 'var(--primary-fixed)' : 'var(--tertiary-fixed)',
                          color: w.payout_status === 'paid' ? 'var(--primary)' : 'var(--tertiary)'
                        }}>
                        {w.payout_status.toUpperCase()}
                      </span>
                    </div>
                    {w.verification_status === 'pending' && !w.proof_url && (
                      <label className="btn btn-secondary text-xs mt-2 cursor-pointer inline-flex items-center gap-1">
                        <Upload size={12} /> Upload Proof
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => handleProofUpload(w.id, e.target.files[0])} />
                      </label>
                    )}
                    {uploadingProof === w.id && <span className="text-xs text-muted flex items-center gap-1 mt-1"><Loader2 size={12} className="animate-spin" /> Uploading...</span>}
                    {w.proof_url && <span className="text-xs mt-1 block" style={{ color: 'var(--primary)' }}>Proof submitted · {w.verification_status}</span>}
                  </div>
                ))}
              </div>
            )}
            {winners.length === 0 && <div className="text-sm text-muted mt-2">No winnings yet. Keep playing!</div>}
          </motion.div>

          {/* Supported Charity */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-elevated">
            <div className="flex items-center gap-3 mb-4">
              <Heart size={20} style={{ color: 'var(--error)' }} />
              <h2 className="title-md">Supported Charity</h2>
            </div>
            {profile?.charity_id ? (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">{charityName || 'Loading...'}</div>
                <div className="w-full rounded-full h-2 mt-2" style={{ backgroundColor: 'var(--surface-container-highest)' }}>
                  <div className="h-2 rounded-full transition-all" style={{ width: `${charityPercentage}%`, backgroundColor: 'var(--primary)' }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted mt-1">
                  <div className="flex items-center gap-2">
                    <span>{charityPercentage}% Contribution</span>
                    <button disabled={savingPercentage} onClick={() => handlePercentageChange(Math.max(10, charityPercentage - 5))}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                      style={{ backgroundColor: 'var(--surface-container-high)' }}>-</button>
                    <button disabled={savingPercentage} onClick={() => handlePercentageChange(Math.min(100, charityPercentage + 5))}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                      style={{ backgroundColor: 'var(--surface-container-high)' }}>+</button>
                  </div>
                  <Link to="/charities" className="hover:underline" style={{ color: 'var(--tertiary)' }}>Change</Link>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted mb-3">You haven't selected a charity yet.</p>
                <Link to="/charities" className="btn btn-primary text-sm">Choose a Charity</Link>
              </div>
            )}
          </motion.div>

          {/* Participation Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-elevated">
            <h2 className="title-md mb-4">Participation Summary</h2>
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted">Draws Entered</span>
              <span className="font-bold text-lg">{winners.length}</span>
            </div>
            <div className="p-3 rounded-lg mt-4" style={{ backgroundColor: 'var(--surface-container-low)' }}>
              <div className="text-xs font-bold mb-1" style={{ color: 'var(--primary)' }}>NEXT DRAW</div>
              <div className="text-sm font-semibold">End of Month Jackpot</div>
              <div className="text-xs text-muted mt-1">
                {scores.length < 5 ? `You need ${5 - scores.length} more score(s) to enter!` : 'You are eligible for the next draw!'}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
