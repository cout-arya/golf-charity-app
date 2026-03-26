import { Link } from 'react-router-dom';
import { Zap, Target, Trophy, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } };

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* Top Nav */}
      <nav className="w-full flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="font-display font-bold text-xl text-primary">ImpactLinks Golf</div>
        <div className="flex gap-4">
          <Link to="/login" className="btn btn-secondary">Sign In</Link>
          <Link to="/subscribe" className="btn btn-primary">Subscribe Now</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="flex flex-col items-center text-center mt-20 px-4 max-w-4xl mx-auto">
        <motion.h1 {...fadeUp} className="display-lg text-on-surface mb-6 leading-tight">
          Turn your <span className="text-primary">Stableford rounds</span> into global impact.
        </motion.h1>
        <motion.p {...fadeUp} transition={{ delay: 0.1 }} className="text-on-surface-variant mb-10 max-w-2xl text-lg">
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
        <motion.h2 {...fadeUp} className="headline-md mb-12 text-center">How ImpactLinks Works</motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Zap size={32} />, color: 'text-primary', num: '1', title: 'Subscribe & Select', desc: 'Join the platform and choose a charity. At least 10% goes directly to them.' },
            { icon: <Target size={32} />, color: 'text-secondary', num: '2', title: 'Track 5 Scores', desc: 'Log your Stableford points (1-45). We keep your last 5 securely on record.' },
            { icon: <Trophy size={32} />, color: 'text-tertiary', num: '3', title: 'Win the Draw', desc: 'Match 3, 4, or 5 of your scores to the monthly draw to win a share of the pool.' },
          ].map((step, idx) => (
            <motion.div key={idx} {...fadeUp} transition={{ delay: idx * 0.1 }}
              className="card-elevated text-center hover:border-primary border border-transparent transition-colors">
              <div className={`${step.color} mb-4 flex justify-center`}>{step.icon}</div>
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
            <h2 className="headline-md mb-4 text-tertiary">Charity Spotlight</h2>
            <h3 className="display-lg text-on-surface mb-4" style={{ fontSize: '2.5rem' }}>The Water Project</h3>
            <p className="text-muted mb-8">
              Providing access to clean, safe water across sub-Saharan Africa. Join ImpactLinks Golf and help build sustainable wells with every swing.
            </p>
            <Link to="/charities" className="btn btn-secondary flex items-center gap-2 w-fit">Explore Charities <ArrowRight size={16} /></Link>
          </div>
          <div className="flex-1 w-full bg-surface-container-highest rounded-2xl h-64 flex items-center justify-center border border-glass-border">
            <span className="text-primary opacity-50 font-bold">Impact Visual Here</span>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
