import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { User, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await supabase.from('profiles').update({
      full_name: fullName,
      avatar_url: avatarUrl,
    }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4" style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <Link to="/dashboard" className="font-semibold mb-8 hover:opacity-80 transition-opacity flex items-center gap-2"
        style={{ color: 'var(--primary)' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mt-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl"
            style={{ backgroundColor: 'var(--primary-fixed)', color: 'var(--primary)' }}>
            {fullName?.[0] || <User size={24} />}
          </div>
          <div>
            <h1 className="headline-md">Profile Settings</h1>
            <p className="text-sm text-muted">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="input-field" placeholder="Your full name" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted">Avatar URL</label>
            <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
              className="input-field" placeholder="https://example.com/avatar.jpg" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted">Role</label>
            <input type="text" value={profile?.role || 'user'} disabled className="input-field opacity-50" />
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving} className="btn btn-primary flex items-center gap-2">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
            </button>
            {saved && <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>✓ Saved successfully!</span>}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
