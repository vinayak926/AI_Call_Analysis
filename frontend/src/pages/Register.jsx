import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Eye, EyeOff, Phone,
  Building2, Briefcase, ArrowRight, CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', company: '',
    position: '', password: '', confirmPassword: '', agreeTerms: false,
  });

  const set = (key) => (e) => setFormData({ ...formData, [key]: e.target.value });

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match!");
      return;
    }
    setIsLoading(true);
    try {
      const res = await register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        position: formData.position,
        password: formData.password,
      });
      setSuccess(res.message || 'Registration successful! Admin approval ka wait karo.');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };


  // Shared input field style
  const fieldBox = {
    display: 'flex', alignItems: 'center', gap: '12px',
    background: '#F5F2EC',
    border: '1px solid #E0DAD0',
    borderRadius: '14px',
    padding: '13px 16px',
  };
  const inputStyle = {
    flex: 1, background: 'transparent',
    border: 'none', outline: 'none',
    fontSize: '14px', color: '#1a1a1a',
    fontFamily: 'inherit',
  };
  const iconStyle = { color: '#aaa6a0', flexShrink: 0 };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#EDE8DF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ background: 'white', borderRadius: '28px', border: '1px solid #d8d2c8', boxShadow: '0 8px 48px rgba(0,0,0,0.08)', padding: '56px 48px', maxWidth: '480px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f0f7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={32} style={{ color: '#7a9a5a' }} />
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 12px' }}>Request Submitted!</h2>
          <p style={{ fontSize: '15px', color: '#6b6560', lineHeight: 1.65, marginBottom: '32px' }}>{success}</p>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '14px', background: '#111', color: 'white', fontWeight: '700', fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
            GO TO LOGIN <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#EDE8DF',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      {/* ══════════════════════════════════════════════
          LEFT SIDE — Benefits Panel
      ══════════════════════════════════════════════ */}
      <div style={{
        padding: '48px 64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <div>
          <p style={{
            fontSize: '11px', fontWeight: '700',
            letterSpacing: '0.14em', color: '#aaa6a0',
            textTransform: 'uppercase', marginBottom: '64px',
          }}>
            CALLINTEL AI — SALES CALL INTELLIGENCE
          </p>

          {/* Heading */}
          <h1 style={{
            fontSize: 'clamp(40px, 4.5vw, 58px)',
            fontWeight: '800',
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            color: '#1a1a1a',
            margin: '0 0 24px',
          }}>
            Start analyzing{' '}
            <em style={{
              fontStyle: 'italic',
              color: '#7a9a5a',
              fontFamily: 'Georgia, serif',
              fontWeight: '400',
              display: 'block',
              lineHeight: 1.1,
            }}>
              every call.
            </em>
          </h1>

          <p style={{
            fontSize: '17px', lineHeight: 1.65,
            color: '#6b6560', maxWidth: '400px', marginBottom: '48px',
          }}>
            Join education sales teams using AI to analyze student calls, score leads, and boost counselor performance.
          </p>

          {/* Benefits checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '420px' }}>
            {[
              'AI-powered call transcription & analysis',
              'Multi-language support — Hindi, English, Gujarati',
              'Automatic lead scoring (1–10)',
              'Student sentiment & intent detection',
              'Counselor performance tracking',
              'Auto-filled Excel & Google Sheet reports',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={16} style={{ color: '#7a9a5a', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', color: '#4a4540', fontWeight: '500' }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: '32px', marginTop: '48px',
            paddingTop: '36px', borderTop: '1px solid #d0c8bc',
          }}>
            {[
              { num: '100%', label: 'Call coverage' },
              { num: '3 langs', label: 'Supported' },
              { num: 'Auto', label: 'Excel reports' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
                  {s.num}
                </div>
                <div style={{ fontSize: '12px', color: '#aaa6a0', fontWeight: '600', letterSpacing: '0.05em', marginTop: '2px' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '12px', color: '#aaa6a0', marginTop: '48px' }}>
          © 2026 CallIntel AI — Invite-only platform
        </p>
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT SIDE — Register Form Card
      ══════════════════════════════════════════════ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 64px',
        overflowY: 'auto',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '460px',
          background: 'white',
          borderRadius: '28px',
          border: '1px solid #d8d2c8',
          boxShadow: '0 8px 48px rgba(0,0,0,0.08)',
          padding: '44px',
        }}>

          {/* Briefcase icon */}
          <div style={{
            width: '56px', height: '56px', borderRadius: '18px',
            background: '#EDE8DF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '24px',
          }}>
            <Briefcase size={24} style={{ color: '#6b6560' }} />
          </div>

          <h2 style={{
            fontSize: '28px', fontWeight: '800',
            color: '#1a1a1a', letterSpacing: '-0.02em',
            margin: '0 0 6px',
          }}>
            Create your{' '}
            <em style={{
              fontStyle: 'italic',
              color: '#7a9a5a',
              fontFamily: 'Georgia, serif',
              fontWeight: '400',
            }}>
              account
            </em>
          </h2>
          <p style={{ fontSize: '14px', color: '#8a8480', marginBottom: '32px' }}>
            Request access to the Sales Call Intelligence platform.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* Full Name */}
              <div style={fieldBox}>
                <User size={16} style={iconStyle} />
                <input
                  type="text" placeholder="Full name"
                  value={formData.fullName} onChange={set('fullName')}
                  required style={inputStyle}
                />
              </div>

              {/* Email */}
              <div style={fieldBox}>
                <Mail size={16} style={iconStyle} />
                <input
                  type="email" placeholder="Work email"
                  value={formData.email} onChange={set('email')}
                  required style={inputStyle}
                />
              </div>

              {/* Phone */}
              <div style={fieldBox}>
                <Phone size={16} style={iconStyle} />
                <input
                  type="tel" placeholder="Phone number"
                  value={formData.phone} onChange={set('phone')}
                  required style={inputStyle}
                />
              </div>

              {/* Company / Institute */}
              <div style={fieldBox}>
                <Building2 size={16} style={iconStyle} />
                <input
                  type="text" placeholder="Institute / Company name"
                  value={formData.company} onChange={set('company')}
                  required style={inputStyle}
                />
              </div>

              {/* Position */}
              <div style={fieldBox}>
                <Briefcase size={16} style={iconStyle} />
                <input
                  type="text" placeholder="Your role (e.g. Sales Manager, Counselor)"
                  value={formData.position} onChange={set('position')}
                  required style={inputStyle}
                />
              </div>

              {/* Password */}
              <div style={fieldBox}>
                <Lock size={16} style={iconStyle} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create password"
                  value={formData.password} onChange={set('password')}
                  required style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#aaa6a0' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Confirm Password */}
              <div style={fieldBox}>
                <Lock size={16} style={iconStyle} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={formData.confirmPassword} onChange={set('confirmPassword')}
                  required style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#aaa6a0' }}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Terms checkbox */}
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                cursor: 'pointer', padding: '4px 0',
              }}>
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  required
                  style={{ marginTop: '2px', width: '15px', height: '15px', accentColor: '#7a9a5a', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', color: '#6b6560', lineHeight: 1.5 }}>
                  I agree to the{' '}
                  <span style={{ color: '#1a1a1a', fontWeight: '700', cursor: 'pointer' }}>Terms of Service</span>
                  {' '}and{' '}
                  <span style={{ color: '#1a1a1a', fontWeight: '700', cursor: 'pointer' }}>Privacy Policy</span>
                </span>
              </label>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%', marginTop: '6px',
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
                  <><span>REQUEST ACCESS</span><ArrowRight size={15} /></>
                )}
              </button>

            </div>
          </form>

          {/* Bottom trust badges */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '20px',
            marginTop: '20px', paddingTop: '20px',
            borderTop: '1px solid #E8E3DA',
          }}>
            {['Invite-only platform', '100% call coverage', 'Multi-language AI'].map((t) => (
              <span key={t} style={{
                fontSize: '11px', color: '#aaa6a0', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <CheckCircle size={11} style={{ color: '#7a9a5a' }} /> {t}
              </span>
            ))}
          </div>

          {/* Already have account */}
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b6560', margin: '20px 0 0' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#1a1a1a', fontWeight: '700', textDecoration: 'none' }}>
              Sign in
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