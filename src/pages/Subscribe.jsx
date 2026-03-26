import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Star, Trophy, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { motion } from 'framer-motion';

export default function Subscribe() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(null); // 'monthly' | 'yearly' | null
  const [showCheckout, setShowCheckout] = useState(null);
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/29');
  const [cvc, setCvc] = useState('123');

  const handleSubscribe = async (plan) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowCheckout(plan);
  };

  const handleCheckout = async () => {
    setProcessing(showCheckout);
    
    // Simulate a 2-second Stripe processing delay
    await new Promise(r => setTimeout(r, 2000));

    const now = new Date();
    const periodEnd = new Date(now);
    if (showCheckout === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Upsert subscription record
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      plan: showCheckout,
      status: 'active',
      stripe_sub_id: `sim_${Date.now()}`,
      stripe_customer_id: `cus_sim_${user.id.slice(0, 8)}`,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    }, { onConflict: 'user_id' });

    if (error) {
      console.error('Subscription error:', error);
      alert('Subscription failed: ' + error.message);
    } else {
      navigate('/user');
    }
    setProcessing(null);
    setShowCheckout(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      <nav className="w-full flex justify-between items-center px-6 max-w-7xl mx-auto mb-16">
        <Link to="/" className="font-display font-bold text-xl text-primary">ImpactLinks Golf</Link>
        <Link to={user ? '/user' : '/login'} className="btn btn-secondary">{user ? 'Dashboard' : 'Sign In'}</Link>
      </nav>

      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="display-lg text-center mb-4">Choose Your Impact Plan</motion.h1>
      <p className="text-muted text-center max-w-xl mb-16">Every subscription funds life-changing charities. Pick the plan that suits you, and start turning your Stableford rounds into real-world impact.</p>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => !processing && setShowCheckout(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="card max-w-md w-full glass-panel p-8" onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="text-primary" size={24} />
              <h2 className="title-md">Secure Checkout</h2>
            </div>
            <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: 'var(--surface-container-highest)' }}>
              <div className="flex justify-between items-center">
                <span className="font-semibold capitalize">{showCheckout} Plan</span>
                <span className="text-primary font-bold text-lg">{showCheckout === 'monthly' ? '£9.99/mo' : '£89.99/yr'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-muted mb-1 block">Card Number</label>
                <input className="input-field" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">Expiry</label>
                  <input className="input-field" value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted mb-1 block">CVC</label>
                  <input className="input-field" value={cvc} onChange={e => setCvc(e.target.value)} placeholder="123" />
                </div>
              </div>
            </div>

            <button onClick={handleCheckout} disabled={!!processing} className="btn btn-primary w-full h-12">
              {processing ? <><Loader2 size={18} className="animate-spin mr-2" /> Processing...</> : `Pay ${showCheckout === 'monthly' ? '£9.99' : '£89.99'}`}
            </button>
            <p className="text-xs text-muted text-center mt-3">Test mode — no real charge will occur.</p>
          </motion.div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Monthly Plan */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card-elevated flex flex-col items-center text-center p-8 border border-glass-border hover:border-primary transition-colors">
          <div className="text-sm text-primary font-bold uppercase tracking-widest mb-4">Monthly</div>
          <div className="display-lg mb-2">£9.99<span className="text-lg text-muted font-normal">/mo</span></div>
          <p className="text-muted text-sm mb-8">Billed monthly. Cancel anytime.</p>
          <ul className="text-left text-sm flex flex-col gap-3 mb-8 w-full">
            <li className="flex items-center gap-2"><Check size={16} className="text-primary flex-shrink-0" /> Track 5 Stableford scores</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-primary flex-shrink-0" /> Monthly prize draw entry</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-primary flex-shrink-0" /> 10%+ to your chosen charity</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-primary flex-shrink-0" /> Full dashboard access</li>
          </ul>
          <button onClick={() => handleSubscribe('monthly')} className="btn btn-primary w-full">Subscribe Monthly</button>
        </motion.div>

        {/* Yearly Plan */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card-elevated flex flex-col items-center text-center p-8 border-2 border-tertiary relative">
          <div className="absolute -top-3 px-4 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--tertiary)', color: 'var(--on-tertiary)' }}>BEST VALUE</div>
          <div className="text-sm text-tertiary font-bold uppercase tracking-widest mb-4">Yearly</div>
          <div className="display-lg mb-2">£89.99<span className="text-lg text-muted font-normal">/yr</span></div>
          <p className="text-muted text-sm mb-8">Save 25%! Billed annually.</p>
          <ul className="text-left text-sm flex flex-col gap-3 mb-8 w-full">
            <li className="flex items-center gap-2"><Check size={16} className="text-tertiary flex-shrink-0" /> Everything in Monthly</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-tertiary flex-shrink-0" /> Priority draw weighting</li>
            <li className="flex items-center gap-2"><Star size={16} fill="currentColor" className="text-tertiary flex-shrink-0" /> Exclusive yearly jackpot</li>
            <li className="flex items-center gap-2"><Trophy size={16} className="text-tertiary flex-shrink-0" /> Impact Champion badge</li>
          </ul>
          <button onClick={() => handleSubscribe('yearly')} className="btn w-full" style={{ backgroundColor: 'var(--tertiary)', color: 'var(--on-tertiary)' }}>Subscribe Yearly</button>
        </motion.div>
      </div>

      <p className="text-xs text-muted mt-12 text-center max-w-lg">
        Payments are handled securely via Stripe. By subscribing you agree to our Terms of Service. 
        Your charity contribution is automatically deducted and tracked on your dashboard.
      </p>
    </div>
  );
}
