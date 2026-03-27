import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Clear errors when typing
  useEffect(() => {
    setError('');
  }, [email, password, fullName, isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    let result;
    if (isLogin) {
      result = await signIn(email, password);
    } else {
      result = await signUp(email, password, fullName);
    }

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
    } else if (!isLogin && result.data?.user && !result.data.session) {
      setSuccess('Account created! Check your email to confirm, then sign in.');
      setLoading(false);
      setIsLogin(true);
    } else {
      // Redirect based on role
      const userId = result.data?.user?.id;
      if (userId) {
        const { data: prof } = await supabase.from('profiles').select('role').eq('id', userId).single();
        if (prof?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/user');
        }
      } else {
        navigate('/user');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg-color)' }}>
      <Link to="/" className="font-semibold mb-8 hover:opacity-80 transition-opacity flex items-center gap-2"
        style={{ color: 'var(--primary)' }}>
        ← Back to ImpactLinks
      </Link>
      
      <div className="card max-w-md w-full" style={{ padding: '2.5rem' }}>
        <h1 className="headline-md text-center mb-2">{isLogin ? 'Welcome Back' : 'Join the Impact'}</h1>
        <p className="text-center text-muted text-sm mb-8">
          {isLogin ? 'Sign in to log scores and check draws.' : 'Create an account to dedicate your rounds to charity.'}
        </p>

        {success && (
          <div className="p-3 rounded-lg text-sm mb-6"
            style={{ backgroundColor: 'var(--primary-fixed)', color: 'var(--primary)' }}>
            {success}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg text-sm mb-6"
            style={{ backgroundColor: 'var(--error-container)', color: 'var(--error)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted">Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={!isLogin}
                className="input-field" 
                placeholder="Jordan Spieth"
              />
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field" 
              placeholder="jordan@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field" 
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary mt-4 w-full h-12">
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-muted">
          {isLogin ? "Don't have an account? " : "Already making an impact? "}
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
              setEmail('');
              setPassword('');
              setFullName('');
            }} 
            className="font-semibold bg-transparent border-none cursor-pointer hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
