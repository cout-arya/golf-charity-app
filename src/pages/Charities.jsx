import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { motion } from 'framer-motion';

const SAMPLE_CHARITIES = [
  { id: '1', name: 'The Water Project', description: 'Providing clean, safe water across sub-Saharan Africa through sustainable well construction.', featured: true },
  { id: '2', name: 'Code.org', description: 'Expanding access to computer science in schools and increasing participation by underrepresented minorities.', featured: false },
  { id: '3', name: 'Caddie For A Cure', description: 'Using the game of golf to support cancer research, treatment, and patient care programs.', featured: true },
  { id: '4', name: 'On Course Foundation', description: 'Using golf to aid the recovery and rehabilitation of wounded, injured, and sick military personnel.', featured: false },
  { id: '5', name: 'First Tee', description: 'Building game-changers by introducing young people to golf and its inherent values.', featured: true },
  { id: '6', name: 'Trees for the Future', description: 'Training communities to restore degraded land through Forest Garden planting initiatives.', featured: false },
];

export default function Charities() {
  const { user, profile, refreshProfile } = useAuth();
  const [search, setSearch] = useState('');
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [charities, setCharities] = useState([]);
  const [selecting, setSelecting] = useState(null);

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    const { data } = await supabase.from('charities').select('*');
    if (data && data.length > 0) {
      setCharities(data);
    } else {
      setCharities(SAMPLE_CHARITIES);
    }
  };

  const handleSelectCharity = async (charityId) => {
    if (!user) return;
    setSelecting(charityId);
    await supabase.from('profiles').update({ charity_id: charityId }).eq('id', user.id);
    await refreshProfile();
    setSelecting(null);
  };

  const filtered = charities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesFeatured = filterFeatured ? c.featured : true;
    return matchesSearch && matchesFeatured;
  });

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="max-w-7xl mx-auto">
        <nav className="flex justify-between items-center mb-12">
          <Link to="/" className="font-display font-bold text-xl" style={{ color: 'var(--primary)' }}>⛳ ImpactLinks Golf</Link>
          <div className="flex gap-3">
            {user && <Link to="/dashboard" className="btn btn-secondary text-sm flex items-center gap-1"><ArrowLeft size={14} /> Dashboard</Link>}
            {!user && <Link to="/login" className="btn btn-secondary">Sign In</Link>}
          </div>
        </nav>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <span className="label-kicker" style={{ color: 'var(--tertiary)' }}>OUR PARTNERS</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="display-lg mb-4">Our Charity Partners</motion.h1>
        <p className="text-muted mb-10 max-w-2xl">Select a charity to receive a portion of your subscription. You can change your charity at any time from your dashboard.</p>

        <div className="flex gap-4 mb-10 flex-wrap">
          <div className="relative flex-grow max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--outline)' }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search charities..." className="input-field pl-9" />
          </div>
          <button onClick={() => setFilterFeatured(!filterFeatured)}
            className={`btn ${filterFeatured ? 'btn-primary' : 'btn-secondary'} text-sm`}>
            {filterFeatured ? <span className="flex items-center gap-1"><Star size={14} fill="currentColor" /> Featured Only</span> : 'Show All'}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {filtered.map((charity, idx) => (
            <motion.div key={charity.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="card-elevated flex flex-col justify-between transition-shadow hover:shadow-lg"
              style={{
                border: profile?.charity_id === charity.id
                  ? '2px solid var(--primary)'
                  : '1px solid var(--outline-variant)'
              }}>
              <div>
                {charity.featured && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full mb-3"
                    style={{ backgroundColor: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed-variant)' }}>
                    <Star size={12} fill="currentColor" /> Featured
                  </span>
                )}
                <h3 className="title-md mb-2">{charity.name}</h3>
                <p className="text-sm text-muted mb-4">{charity.description}</p>
              </div>
              {user && (
                profile?.charity_id === charity.id ? (
                  <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--primary)' }}>
                    <Heart size={16} fill="currentColor" /> Your Selected Charity
                  </div>
                ) : (
                  <button onClick={() => handleSelectCharity(charity.id)} disabled={selecting === charity.id}
                    className="btn btn-secondary text-sm w-full flex items-center justify-center gap-2">
                    <Heart size={14} />
                    {selecting === charity.id ? 'Selecting...' : 'Select as My Charity'}
                  </button>
                )
              )}
              {!user && (
                <Link to="/login" className="btn btn-secondary text-sm w-full text-center">Sign in to Select</Link>
              )}
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center text-muted py-16">No charities match your search.</div>
        )}
      </div>
    </div>
  );
}
