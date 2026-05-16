// src/components/ui/ProgressBar.jsx
import React from 'react';

/**
 * ProgressBar — animated horizontal progress bar
 *
 * Props:
 *   value      {number}  0–100 (percentage filled)
 *   max        {number}  denominator (default 100); if provided, value/max is used
 *   color      {string}  bar fill color (default: #6366f1)
 *   height     {number}  bar height in px (default: 8)
 *   label      {string}  optional left label
 *   showValue  {boolean} show numeric value on the right (default: true)
 *   unit       {string}  suffix appended to value, e.g. '%' or '/10'
 *   style      {object}  extra styles on wrapper
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  color,
  height = 8,
  label,
  showValue = true,
  unit = '',
  style = {},
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  // Auto-colour based on percentage if no explicit colour given
  const autoColor = () => {
    if (pct >= 70) return '#16a34a';
    if (pct >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const barColor = color || autoColor();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', ...style }}>
      {/* Left label */}
      {label && (
        <span style={{
          fontSize: '13px', color: '#6b7280', flexShrink: 0,
          minWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      )}

      {/* Track */}
      <div style={{
        flex: 1, height: `${height}px`, background: '#f1f5f9',
        borderRadius: '999px', overflow: 'hidden',
      }}>
        {/* Fill */}
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: barColor,
            borderRadius: '999px',
            transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>

      {/* Right value */}
      {showValue && (
        <span style={{
          fontSize: '13px', fontWeight: '800', color: '#1e293b',
          flexShrink: 0, minWidth: '36px', textAlign: 'right',
        }}>
          {value != null ? `${value}${unit}` : '—'}
        </span>
      )}
    </div>
  );
}
