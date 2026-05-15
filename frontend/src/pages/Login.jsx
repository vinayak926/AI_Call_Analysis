import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LogoMark = () => (
  <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
    <path d="M4 6 L14 22 L24 6" stroke="#1a1a1a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

   const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
        const user = await login(formData.email, formData.password);
        // Role ke hisab se redirect karo
        if (user.role === 'super_admin' || user.role === 'company_admin') {
            navigate('/admin');
        } else {
            navigate('/dashboard');
        }
        } catch (err) {
        setError(err.response?.data?.message || 'Login failed. Try again.');
        } finally {
        setIsLoading(false);
        }
    };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#EDE8DF',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      {/* ══════════════════════════════════════════════
          LEFT SIDE — Heading + Feature Cards
      ══════════════════════════════════════════════ */}
      <div style={{
        padding: '48px 64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>

        {/* Top: brand label */}
        <div>
          <p style={{
            fontSize: '11px', fontWeight: '700',
            letterSpacing: '0.14em', color: '#aaa6a0',
            textTransform: 'uppercase', marginBottom: '64px',
          }}>
            CALLINTEL AI WORKSPACE
          </p>

          {/* Main heading */}
          <h1 style={{
            fontSize: 'clamp(40px, 4.5vw, 60px)',
            fontWeight: '800',
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            color: '#1a1a1a',
            margin: '0 0 24px',
          }}>
            Sign in to your<br />
            Lead Intelligence{' '}
            <em style={{
              fontStyle: 'italic',
              color: '#7a9a5a',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: '400',
            }}>
              workspace.
            </em>
          </h1>

          <p style={{
            fontSize: '17px', lineHeight: 1.65,
            color: '#6b6560', maxWidth: '400px', marginBottom: '52px',
          }}>
            Review call transcripts, lead scores, counselor performance, and student sentiment signals — all in one place.
          </p>

          {/* Feature cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '440px' }}>
            {[
              {
                title: 'Role based access',
                desc: 'Counselors, company admins, and super admins enter the right workspace automatically.',
              },
              {
                title: 'Lead intelligence focused',
                desc: 'Review high-intent students, pending follow-ups, and counselor performance signals.',
              },
              {
                title: 'Secure & invite-only',
                desc: 'Invite-only access ensures only authorized team members can view call data.',
              },
            ].map((item) => (
              <div key={item.title} style={{
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                background: 'rgba(255,255,255,0.55)',
                border: '1px solid #d8d2c8',
                borderRadius: '18px',
                padding: '18px 20px',
              }}>
                <CheckCircle size={18} style={{ color: '#7a9a5a', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: '13px', color: '#8a8480', lineHeight: 1.55, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: footer note */}
        <p style={{ fontSize: '12px', color: '#aaa6a0', marginTop: '48px' }}>
          © 2026 CallIntel AI — Sales Call Intelligence System
        </p>
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT SIDE — Login Form Card
      ══════════════════════════════════════════════ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 64px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'white',
          borderRadius: '28px',
          border: '1px solid #d8d2c8',
          boxShadow: '0 8px 48px rgba(0,0,0,0.08)',
          padding: '44px',
        }}>

          {/* Shield icon circle */}
          <div style={{
            width: '56px', height: '56px', borderRadius: '18px',
            background: '#EDE8DF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '24px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b6560" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>

          {/* Welcome back */}
          <h2 style={{
            fontSize: '28px', fontWeight: '800',
            color: '#1a1a1a', letterSpacing: '-0.02em',
            margin: '0 0 6px',
          }}>
            Welcome{' '}
            <em style={{
              fontStyle: 'italic',
              color: '#7a9a5a',
              fontFamily: 'Georgia, serif',
              fontWeight: '400',
            }}>
              back
            </em>
          </h2>
          <p style={{ fontSize: '14px', color: '#8a8480', marginBottom: '36px' }}>
            Use your company account to continue.
          </p>

          <form onSubmit={handleSubmit}>

            {/* Email field */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: '#F5F2EC',
              border: '1px solid #E0DAD0',
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '12px',
            }}>
              <Mail size={16} style={{ color: '#aaa6a0', flexShrink: 0 }} />
              <input
                type="email"
                placeholder="Work email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{
                  flex: 1, background: 'transparent',
                  border: 'none', outline: 'none',
                  fontSize: '14px', color: '#1a1a1a',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Password field */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: '#F5F2EC',
              border: '1px solid #E0DAD0',
              borderRadius: '14px',
              padding: '14px 16px',
              marginBottom: '10px',
            }}>
              <Lock size={16} style={{ color: '#aaa6a0', flexShrink: 0 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                style={{
                  flex: 1, background: 'transparent',
                  border: 'none', outline: 'none',
                  fontSize: '14px', color: '#1a1a1a',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#aaa6a0' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginBottom: '28px' }}>
              <button type="button" style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', color: '#8a8480', fontFamily: 'inherit',
              }}>
                Forgot password?
              </button>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: '16px',
                borderRadius: '14px',
                background: '#111', color: 'white',
                border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                fontWeight: '700', fontSize: '13px',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                fontFamily: 'inherit',
                opacity: isLoading ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {isLoading ? (
                <div style={{
                  width: '18px', height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }} />
              ) : (
                <><span>SIGN IN</span><ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Invite-only note */}
          <p style={{
            textAlign: 'center', fontSize: '12px', color: '#aaa6a0',
            marginTop: '24px', lineHeight: 1.5,
          }}>
            System is invite-only. Contact your administrator<br />if you need access.
          </p>

          {/* Divider */}
          <div style={{
            height: '1px', background: '#E8E3DA',
            margin: '24px 0',
          }} />

          {/* Link to register */}
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b6560', margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: '#1a1a1a', fontWeight: '700', textDecoration: 'none',
            }}>
              Request access
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder { color: #aaa6a0; }
      `}</style>
    </div>
  );
}