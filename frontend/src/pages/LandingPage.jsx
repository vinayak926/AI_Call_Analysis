import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic, BarChart3, Shield, Users, Clock, FileText,
  TrendingUp, CheckCircle, ArrowRight, Headphones, Zap, Activity
} from 'lucide-react';

// ── Rotating words ──────────────────────────────────────────
const rotatingWords = ['sales call.', 'student call.', 'counselor call.', 'lead call.'];

// ── Navbar Logo (V mark) ─────────────────────────
const LogoMark = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M4 6 L14 22 L24 6" stroke="#1a1a1a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

export default function LandingPage() {
  const [wordIndex, setWordIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setFade(true);
      }, 350);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ backgroundColor: '#EDE8DF', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ══════════════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════════════ */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', maxWidth: '1400px', margin: '0 auto',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'white', borderRadius: '50px',
          padding: '8px 18px 8px 12px',
          border: '1px solid #e2ddd6',
        }}>
          <LogoMark />
          <span style={{ fontWeight: '700', fontSize: '16px', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
            CallIntel AI
          </span>
        </div>

        {/* Center Links */}
        <div style={{ display: 'flex', gap: '40px' }}>
          {['System', 'Process', 'Signals'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{
              fontSize: '15px', color: '#6b6560', textDecoration: 'none', fontWeight: '500',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.target.style.color = '#1a1a1a'}
              onMouseLeave={e => e.target.style.color = '#6b6560'}
            >
              {item}
            </a>
          ))}
        </div>

        {/* Login pill button */}
        <Link to="/login" style={{
          padding: '10px 24px', borderRadius: '50px',
          background: 'white', border: '1px solid #d6d0c8',
          fontSize: '14px', fontWeight: '600', color: '#1a1a1a',
          textDecoration: 'none', transition: 'background 0.2s',
        }}>
          Login
        </Link>
      </nav>

      {/* ══════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════ */}
      <section style={{
        maxWidth: '1400px', margin: '0 auto', padding: '24px 48px 80px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center',
      }}>
        {/* LEFT */}
        <div style={{ position: 'relative' }}>

          {/* Wavy SVG background lines */}
          <svg
            style={{ position: 'absolute', top: '60px', left: '-20px', width: '110%', height: '420px', opacity: 0.22, zIndex: 0, pointerEvents: 'none' }}
            viewBox="0 0 700 420" fill="none" xmlns="http://www.w3.org/2000/svg"
          >
            {[80, 140, 200, 260, 320, 380].map((y, i) => (
              <path key={i}
                d={`M-30 ${y} Q100 ${y - 40} 200 ${y + 30} Q320 ${y + 70} 420 ${y - 20} Q530 ${y - 60} 650 ${y + 40} Q720 ${y + 60} 750 ${y + 20}`}
                stroke="#7a8f6a" strokeWidth="1.4" fill="none"
              />
            ))}
          </svg>

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* AI CALL ANALYSIS badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'white', borderRadius: '50px', padding: '8px 18px',
              border: '1px solid #d6d0c8', marginBottom: '36px',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5a8a4a', display: 'inline-block' }}></span>
              <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.12em', color: '#555', textTransform: 'uppercase' }}>
                AI Sales Call Analysis
              </span>
            </div>

            {/* Main heading */}
            <h1 style={{
              fontSize: 'clamp(56px, 6vw, 88px)',
              fontWeight: '800',
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              color: '#111',
              margin: '0 0 36px',
            }}>
              Know what<br />
              happened in<br />
              <em style={{
                fontStyle: 'italic',
                color: '#7a9a5a',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontWeight: '400',
                fontSize: '0.93em',
                transition: 'opacity 0.35s ease',
                opacity: fade ? 1 : 0,
                display: 'inline-block',
                lineHeight: 1.1,
              }}>
                every
              </em>
              <br />
              <span style={{
                transition: 'opacity 0.35s ease',
                opacity: fade ? 1 : 0,
              }}>
                {rotatingWords[wordIndex]}
              </span>
            </h1>

            {/* Subtext */}
            <p style={{
              fontSize: '17px', lineHeight: 1.65, color: '#6b6560',
              maxWidth: '480px', marginBottom: '40px',
            }}>
              Automatically analyzes sales call recordings — transcribes speech, detects language,
              measures lead intent, and fills structured reports for management.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '36px' }}>
              <Link to="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '16px 28px', borderRadius: '50px',
                background: '#111', color: 'white',
                fontWeight: '700', fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase',
                textDecoration: 'none', transition: 'opacity 0.2s',
              }}>
                REQUEST ACCESS <ArrowRight size={15} />
              </Link>
              <Link to="/login" style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '16px 28px', borderRadius: '50px',
                background: 'white', color: '#111',
                fontWeight: '700', fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase',
                border: '2px solid #d6d0c8', textDecoration: 'none',
              }}>
                LOGIN
              </Link>
            </div>

            {/* Trust checkmarks */}
            <div style={{ display: 'flex', gap: '28px' }}>
              {['Multi-language support', 'Lead scoring', 'Auto-filled reports'].map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <CheckCircle size={14} style={{ color: '#7a9a5a' }} />
                  <span style={{ fontSize: '13px', color: '#8a8480', fontWeight: '500' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Dashboard Card */}
        <div style={{
          background: 'white', borderRadius: '28px',
          border: '1px solid #d6d0c8', boxShadow: '0 8px 48px rgba(0,0,0,0.08)',
          padding: '28px', overflow: 'hidden',
        }}>
          {/* Card Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', color: '#aaa6a0', textTransform: 'uppercase', marginBottom: '6px' }}>
                Lead Intelligence View
              </p>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
                Today's call analysis
              </h3>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'white', border: '1px solid #d6d0c8',
              borderRadius: '50px', padding: '6px 14px',
            }}>
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%', background: '#5a8a4a',
                animation: 'pulse 2s infinite',
              }}></span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#444' }}>Live</span>
            </div>
          </div>

          {/* Stats 3 boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            {[
              { label: 'CALLS ANALYZED', value: '3,472' },
              { label: 'AVG LEAD SCORE', value: '7.4' },
              { label: 'HOT LEADS', value: '218' },
            ].map((s) => (
              <div key={s.label} style={{
                background: '#F5F2EC', borderRadius: '16px',
                padding: '16px', border: '1px solid #e8e3da',
              }}>
                <p style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.1em', color: '#aaa', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {s.label}
                </p>
                <p style={{ fontSize: '26px', fontWeight: '800', color: '#1a1a1a', margin: 0, letterSpacing: '-0.02em' }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Bar Chart */}
          <div style={{
            background: '#EDE8DF', borderRadius: '16px',
            padding: '16px', marginBottom: '12px',
            height: '130px', display: 'flex', alignItems: 'flex-end', gap: '5px',
          }}>
            {[38, 55, 45, 70, 50, 82, 42, 68, 58, 88, 52, 78, 65, 92, 55, 85, 70, 95].map((h, i) => (
              <div key={i} style={{
                flex: 1, borderRadius: '3px 3px 0 0',
                height: `${h}%`,
                background: i % 2 === 0 ? '#3d5230' : '#8aaa70',
              }} />
            ))}
          </div>

          {/* Signal cards */}
          {[
            { label: 'High-intent lead detected', desc: 'Student asked about Data Science placement support.' },
            { label: 'Follow-up required', desc: 'Callback requested for Saturday — counselor: Priya.' },
          ].map((item) => (
            <div key={item.label} style={{
              display: 'flex', gap: '12px', alignItems: 'flex-start',
              background: 'white', border: '1px solid #e8e3da',
              borderRadius: '14px', padding: '14px', marginBottom: '8px',
            }}>
              <CheckCircle size={17} style={{ color: '#7a9a5a', marginTop: '1px', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>{item.label}</p>
                <p style={{ fontSize: '12px', color: '#8a8480', margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════ */}
      <section style={{
        background: '#D8D3C8', borderTop: '1px solid #c8c2b8', borderBottom: '1px solid #c8c2b8',
      }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto', padding: '0 48px',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
        }}>
          {[
            { big: '100%', small: 'CALL COVERAGE' },
            { big: 'Hindi/\nGujrati', small: 'MULTI-LANGUAGE' },
            { big: 'Lead', small: 'SCORING & INTENT' },
            { big: 'Auto-\nfilled', small: 'EXCEL REPORTS' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '48px 32px',
              borderRight: i < 3 ? '1px solid #c0bab0' : 'none',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: item.big.includes('\n') ? '52px' : '64px',
                fontWeight: '800', color: '#1a1a1a',
                letterSpacing: '-0.03em', lineHeight: 1.05,
                whiteSpace: 'pre-line',
              }}>
                {item.big}
              </div>
              <div style={{
                fontSize: '11px', fontWeight: '700', letterSpacing: '0.12em',
                color: '#8a8480', textTransform: 'uppercase', marginTop: '8px',
              }}>
                {item.small}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          VISIBILITY GAP
      ══════════════════════════════════════════════════════ */}
      <section id="system" style={{ maxWidth: '1400px', margin: '0 auto', padding: '100px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '48px', marginBottom: '64px', alignItems: 'start' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.14em', color: '#aaa', textTransform: 'uppercase', paddingTop: '12px' }}>
            THE VISIBILITY GAP
          </p>
          <div>
            <h2 style={{
              fontSize: 'clamp(36px, 4.5vw, 64px)',
              fontWeight: '800', color: '#1a1a1a',
              lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 24px',
            }}>
              Most teams only review a{' '}
              <em style={{ fontStyle: 'italic', color: '#7a9a5a', fontFamily: 'Georgia, serif', fontWeight: '400' }}>
                small sample
              </em>
              {' '}of student calls.
            </h2>
            <p style={{ fontSize: '17px', color: '#6b6560', lineHeight: 1.65, maxWidth: '700px' }}>
              Helps managers see what happened across every student interaction — not just the few recordings manually picked for review. No lead goes unanalyzed.
            </p>
          </div>
        </div>

        {/* 3 feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          {[
            { icon: Zap, title: 'Every call processed', desc: 'AI automatically reads recordings from cloud storage or local folders — MP3, WAV, M4A supported.' },
            { icon: Users, title: 'Lead intent surfaced', desc: 'Detect interested students, follow-up leads, fees concerns, and placement queries instantly.' },
            { icon: Activity, title: 'Counselor performance tracked', desc: 'Give managers data-backed insights on each counselor\'s communication quality and closing rate.' },
          ].map((item, i) => (
            <div key={i} style={{
              background: i === 1 ? 'white' : '#F0EBE2',
              borderRadius: '20px', padding: '32px',
              border: '1px solid #d8d2c8',
              boxShadow: i === 1 ? '0 4px 24px rgba(0,0,0,0.07)' : 'none',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: '#E0DAD0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '28px',
              }}>
                <item.icon size={20} style={{ color: '#6b6560' }} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 10px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#8a8480', lineHeight: 1.6, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          THE SYSTEM
      ══════════════════════════════════════════════════════ */}
      <section id="system-detail" style={{ background: '#E5DFD5', padding: '100px 0', borderTop: '1px solid #d0c8bc' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '60px', alignItems: 'end' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.14em', color: '#aaa', textTransform: 'uppercase', marginBottom: '16px' }}>
                THE SYSTEM
              </p>
              <h2 style={{
                fontSize: 'clamp(36px, 4.5vw, 60px)', fontWeight: '800',
                color: '#1a1a1a', lineHeight: 1.08, letterSpacing: '-0.03em', margin: 0,
              }}>
                Built for measurable{' '}
                <em style={{ fontStyle: 'italic', color: '#7a9a5a', fontFamily: 'Georgia, serif', fontWeight: '400' }}>
                  lead
                </em>
                <br />intelligence.
              </h2>
            </div>
            <p style={{ fontSize: '17px', color: '#6b6560', lineHeight: 1.65, maxWidth: '440px', alignSelf: 'end' }}>
              From audio intake to transcription, language detection, AI analysis, and auto-filled Excel reports.
            </p>
          </div>

          {/* 4 cards in a row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px' }}>
            {[
              { icon: Headphones, title: 'Receive calls from any storage', desc: 'Read recordings from AWS S3, Google Drive, Dropbox, local server, or Railway/VPS folders.' },
              { icon: Mic, title: 'Transcribe & detect language', desc: 'Convert speech to text and detect Hindi, English, or Gujarati — translate to English for analysis.', highlight: true },
              { icon: Shield, title: 'AI analysis with LLM', desc: 'Extract student name, course interest, sentiment, intent, concerns, and counselor performance score.' },
              { icon: TrendingUp, title: 'Auto-fill Excel & alert managers', desc: 'Populate structured reports and send alerts for hot leads, pending follow-ups, and low-performance calls.' },
            ].map((item, i) => (
              <div key={i} style={{
                background: item.highlight ? 'white' : '#EDE7DC',
                borderRadius: '20px', padding: '28px',
                border: '1px solid #d0c8bc',
                boxShadow: item.highlight ? '0 4px 24px rgba(0,0,0,0.08)' : 'none',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: item.highlight ? '#EDE7DC' : '#E0D9CE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '36px',
                }}>
                  <item.icon size={20} style={{ color: '#6b6560' }} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 12px', lineHeight: 1.3 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#8a8480', lineHeight: 1.6, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PROCESS
      ══════════════════════════════════════════════════════ */}
      <section id="process" style={{ maxWidth: '1400px', margin: '0 auto', padding: '100px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '48px', marginBottom: '64px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.14em', color: '#aaa', textTransform: 'uppercase', paddingTop: '12px' }}>
            PROCESS
          </p>
          <h2 style={{
            fontSize: 'clamp(36px, 4.5vw, 64px)', fontWeight: '800',
            color: '#1a1a1a', lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0,
          }}>
            From recordings to an{' '}
            <em style={{ fontStyle: 'italic', color: '#7a9a5a', fontFamily: 'Georgia, serif', fontWeight: '400' }}>
              operating
            </em>
            {' '}view.
          </h2>
        </div>

        {/* 3 process cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          {[
            { num: '01', badge: '1', title: 'Collect', desc: 'Sales call recordings arrive from cloud storage or folders — MP3, WAV, M4A are all supported.' },
            { num: '02', badge: '2', title: 'Analyze', desc: 'AI transcribes speech, detects language, translates if needed, extracts lead details, and scores counselor performance.', highlight: true },
            { num: '03', badge: '3', title: 'Report', desc: 'Managers get auto-filled Excel sheets, lead intelligence dashboards, and alerts for follow-ups.' },
          ].map((step) => (
            <div key={step.num} style={{
              background: step.highlight ? 'white' : '#F0EBE2',
              borderRadius: '20px', padding: '32px',
              border: '1px solid #d8d2c8',
              boxShadow: step.highlight ? '0 4px 24px rgba(0,0,0,0.07)' : 'none',
              position: 'relative',
            }}>
              {/* Amber circle badge */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#D4A853', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px',
              }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{step.badge}</span>
              </div>

              {/* Big number */}
              <div style={{
                fontSize: '64px', fontWeight: '800', color: '#D8D2C8',
                letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '16px',
              }}>
                {step.num}
              </div>

              <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 12px' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#8a8480', lineHeight: 1.6, margin: 0 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          WHAT TEAMS GET
      ══════════════════════════════════════════════════════ */}
      <section id="signals" style={{ background: '#E5DFD5', padding: '100px 0', borderTop: '1px solid #d0c8bc' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.14em', color: '#aaa', textTransform: 'uppercase', marginBottom: '16px' }}>
              WHAT TEAMS GET
            </p>
            <h2 style={{
              fontSize: 'clamp(36px, 4.5vw, 62px)', fontWeight: '800',
              color: '#1a1a1a', lineHeight: 1.1, letterSpacing: '-0.03em', margin: 0,
            }}>
              Lead signals for every{' '}
              <em style={{ fontStyle: 'italic', color: '#7a9a5a', fontFamily: 'Georgia, serif', fontWeight: '400' }}>
                student
              </em>
              {' '}call.
            </h2>
          </div>

          {/* 2-col grid — large cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { icon: Headphones, title: 'Speech to text transcription', desc: 'Convert call recordings into searchable transcripts — supports Hindi, English, and Gujarati.' },
              { icon: Mic, title: 'Language detection & translation', desc: 'Automatically identify the call language and translate to English for standardized analysis.' },
              { icon: Shield, title: 'Lead intent analysis', desc: 'Detect whether the student is interested, needs follow-up, or has concerns around fees, placement, or timing.' },
              { icon: TrendingUp, title: 'Sentiment scoring', desc: 'Track call-level sentiment — Positive, Negative, or Neutral — across all student interactions.' },
              { icon: Activity, title: 'Counselor performance metrics', desc: 'Measure confidence, communication quality, student engagement, and closing probability per counselor.' },
              { icon: Zap, title: 'AI-generated call summary', desc: 'Instantly produce a structured summary including student interest, concerns, and recommended next action.' },
              { icon: Clock, title: 'Follow-up queue', desc: 'Prioritize callbacks and pending follow-ups so no interested student is missed.' },
              { icon: FileText, title: 'Auto-filled Excel reports', desc: 'Export structured rows to Excel or Google Sheets — date, student, counselor, course, sentiment, summary, follow-up.' },
            ].map((item, i) => (
              <div key={i} style={{
                background: i % 4 === 1 || i % 4 === 2 ? 'white' : '#EDE7DC',
                borderRadius: '20px', padding: '36px',
                border: '1px solid #d0c8bc',
                boxShadow: (i % 4 === 1 || i % 4 === 2) ? '0 4px 20px rgba(0,0,0,0.06)' : 'none',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: '#E0DAD0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '32px',
                }}>
                  <item.icon size={20} style={{ color: '#6b6560' }} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 12px' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#8a8480', lineHeight: 1.65, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA SECTION
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: '#111', padding: '100px 48px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.14em', color: '#666', textTransform: 'uppercase', marginBottom: '32px' }}>
            INVITATION-BASED ONBOARDING
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '60px', alignItems: 'center' }}>
            <div>
              <h2 style={{
                fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: '800',
                color: 'white', lineHeight: 1.08, letterSpacing: '-0.03em', margin: '0 0 24px',
              }}>
                See what your student<br />
                calls are{' '}
                <em style={{ fontStyle: 'italic', color: '#9aac8a', fontFamily: 'Georgia, serif', fontWeight: '400' }}>
                  really
                </em>
                {' '}telling you.
              </h2>
              <p style={{ fontSize: '17px', color: '#888', lineHeight: 1.65, maxWidth: '500px', margin: 0 }}>
                Turn sales call recordings into measurable lead intelligence, counselor scores, and automated reports for management.
              </p>
            </div>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: '12px',
              padding: '20px 36px', borderRadius: '50px',
              background: 'white', color: '#111',
              fontWeight: '700', fontSize: '13px', letterSpacing: '0.06em', textTransform: 'uppercase',
              textDecoration: 'none', whiteSpace: 'nowrap',
              border: '2px solid #333', transition: 'background 0.2s',
              flexShrink: 0,
            }}>
              REQUEST ACCESS <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer style={{ background: '#EDE8DF', borderTop: '1px solid #d0c8bc', padding: '32px 48px' }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LogoMark />
            <span style={{ fontWeight: '800', fontSize: '16px', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
              CallIntel AI
            </span>
          </div>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            {['Terms', 'Privacy'].map((t) => (
              <a key={t} href="#" style={{ fontSize: '14px', color: '#8a8480', textDecoration: 'none', fontWeight: '500' }}>
                {t}
              </a>
            ))}
            <span style={{ fontSize: '14px', color: '#aaa' }}>© 2026 CallIntel AI</span>
          </div>
        </div>
      </footer>

      {/* Pulse animation for Live dot */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}