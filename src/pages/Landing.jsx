import { Link } from 'react-router-dom';
import { Zap, Target, Trophy, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } };

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: 'var(--bg-color)' }}>
      {/* Top Nav */}
      <nav className="w-full flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="font-display font-bold text-xl" style={{ color: 'var(--primary)' }}>
          ⛳ ImpactLinks Golf
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="btn btn-secondary">Sign In</Link>
          <Link to="/subscribe" className="btn btn-primary">Subscribe Now</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="flex flex-col items-center text-center mt-24 px-4 max-w-4xl mx-auto">
        <motion.div {...fadeUp}>
          <span className="label-kicker mb-4 block" style={{ color: 'var(--tertiary)' }}>CHARITY · GOLF · IMPACT</span>
        </motion.div>
        <motion.h1 {...fadeUp} className="display-lg mb-6 leading-tight">
          Turn your <span style={{ color: 'var(--primary)' }}>Stableford rounds</span> into global impact.
        </motion.h1>
        <motion.p {...fadeUp} transition={{ delay: 0.1 }} className="text-muted mb-10 max-w-2xl text-lg">
          Not just another golf app. Every round you log helps fund life-changing charities, and gives you a chance to win from our monthly premium prize pool.
        </motion.p>
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          <Link to="/subscribe" className="btn btn-primary flex items-center gap-2" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}>
            Start Making an Impact <ArrowRight size={18} />
          </Link>
        </motion.div>
      </header>

      {/* How It Works Section */}
      <section className="w-full max-w-7xl mx-auto mt-32 px-6">
        <motion.div {...fadeUp} className="text-center mb-4">
          <span className="label-kicker" style={{ color: 'var(--tertiary)' }}>HOW IT WORKS</span>
        </motion.div>
        <motion.h2 {...fadeUp} className="headline-md mb-12 text-center">Three Simple Steps</motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Zap size={32} />, color: 'var(--primary)', num: '01', title: 'Subscribe & Select', desc: 'Join the platform and choose a charity. At least 10% goes directly to them.' },
            { icon: <Target size={32} />, color: 'var(--tertiary)', num: '02', title: 'Track 5 Scores', desc: 'Log your Stableford points (1-45). We keep your last 5 securely on record.' },
            { icon: <Trophy size={32} />, color: 'var(--tertiary-container)', num: '03', title: 'Win the Draw', desc: 'Match 3, 4, or 5 of your scores to the monthly draw to win a share of the pool.' },
          ].map((step, idx) => (
            <motion.div key={idx} {...fadeUp} transition={{ delay: idx * 0.1 }}
              className="card-elevated text-center hover:shadow-lg transition-shadow"
              style={{ border: '1px solid transparent' }}>
              <div className="label-kicker mb-4" style={{ color: step.color }}>{step.num}</div>
              <div className="mb-4 flex justify-center" style={{ color: step.color }}>{step.icon}</div>
              <h3 className="title-md mb-2">{step.title}</h3>
              <p className="text-sm text-muted">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Charity Spotlight */}
      <section className="w-full max-w-7xl mx-auto mt-32 px-6 mb-32">
        <motion.div {...fadeUp} className="glass-panel p-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <span className="label-kicker mb-2 block" style={{ color: 'var(--tertiary)' }}>CHARITY SPOTLIGHT</span>
            <h3 className="display-lg mb-4" style={{ fontSize: '2.5rem' }}>The Water Project</h3>
            <p className="text-muted mb-8">
              Providing access to clean, safe water across sub-Saharan Africa. Join ImpactLinks Golf and help build sustainable wells with every swing.
            </p>
            <Link to="/charities" className="btn btn-secondary flex items-center gap-2 w-fit"
              style={{ border: `2px solid var(--tertiary-container)`, color: 'var(--tertiary)' }}>
              Explore Charities <ArrowRight size={16} />
            </Link>
          </div>
          <div className="flex-1 w-full rounded-xl h-64 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--primary-fixed), var(--surface-container))' }}>
            <span className="font-bold" style={{ color: 'var(--primary)', opacity: 0.6 }}>Impact Visual Here</span>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
