import React, { useState } from 'react';
import { 
  Home, Users, Activity, CheckCircle, XCircle, Plus, LogOut, 
  Award, FileText, Calendar, Upload, Clock, Eye, Shield, Menu,
  ChevronDown, Search, Bell, Settings, TrendingUp, Star, User,
  BookOpen, Briefcase, X, Check, AlertCircle, Download
} from 'lucide-react';

// ============================================
// INLINE STYLES
// ============================================
export const colors = {
  // Brand
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryLight: '#6366F1',

  secondary: '#10B981',
  secondaryDark: '#059669',

  warning: '#F59E0B',
  warningLight: '#FCD34D',

  danger: '#DC2626',
  dangerLight: '#F87171',

  // Layout backgrounds
  darker: '#F4F6FB',        // app background
  dark: '#FFFFFF',         // headers / modals
  card: '#FFFFFF',
  cardHover: '#F1F5F9',

  // Borders
  border: '#E5E7EB',
  borderLight: '#CBD5E1',

  // Text
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',

  // Gradients
  gradient: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
  gradientGreen: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  gradientOrange: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  gradientRed: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',

  // Shadows & effects
  shadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
  glow: '0 0 0 rgba(0,0,0,0)', // glow retired – enterprise mode engaged
};


// ============================================
// BUTTON COMPONENT
// ============================================
export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  fullWidth = false,
  icon: Icon,
  loading = false,
  style = {}
}) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '600',
    borderRadius: '12px',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'Inter, sans-serif',
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
  };

  const sizeStyles = {
    small: { padding: '8px 16px', fontSize: '13px' },
    medium: { padding: '12px 24px', fontSize: '14px' },
    large: { padding: '16px 32px', fontSize: '16px' },
  };

  const variantStyles = {
    primary: {
      background: colors.gradient,
      color: '#fff',
      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
    },
    secondary: {
      background: 'transparent',
      color: colors.text,
      border: `2px solid ${colors.border}`,
    },
    success: {
      background: colors.gradientGreen,
      color: '#fff',
      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
    },
    danger: {
      background: colors.gradientRed,
      color: '#fff',
      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
    },
    warning: {
      background: colors.gradientOrange,
      color: '#fff',
      boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
    },
    ghost: {
      background: 'transparent',
      color: colors.textSecondary,
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
    >
      {loading ? (
        <span style={{
          width: '18px',
          height: '18px',
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: '#fff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      ) : Icon && <Icon size={18} />}
      {children}
    </button>
  );
};



// ============================================
// CHECKBOX COMPONENT
// ============================================
export const Checkbox = ({ checked = false, onChange, disabled = false, style = {} }) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      style={{
        width: '18px',
        height: '18px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        accentColor: colors.secondary,
        ...style,
      }}
    />
  );
};



// ============================================
// INPUT COMPONENT
// ============================================
export const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  error,
  icon: Icon,
  disabled = false,
  required = false,
  style = {}
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: '20px', ...style }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: colors.textSecondary,
        }}>
          {label} {required && <span style={{ color: colors.danger }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon 
            size={18} 
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: focused ? colors.primary : colors.textMuted,
              transition: 'color 0.3s ease',
            }}
          />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: Icon ? '14px 16px 14px 48px' : '14px 16px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            background: colors.card,
            border: `2px solid ${error ? colors.danger : focused ? colors.primary : colors.border}`,
            borderRadius: '12px',
            color: colors.text,
            outline: 'none',
            transition: 'all 0.3s ease',
            boxShadow: focused ? `0 0 0 4px rgba(99, 102, 241, 0.1)` : 'none',
          }}
        />
      </div>
      {error && (
        <p style={{ 
          marginTop: '6px', 
          fontSize: '12px', 
          color: colors.danger,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <AlertCircle size={14} /> {error}
        </p>
      )}
    </div>
  );
};

// ============================================
// SELECT COMPONENT
// ============================================
export const Select = ({ 
  label, 
  value, 
  onChange, 
  options = [],
  placeholder = 'Select an option',
  error,
  disabled = false,
  required = false,
  style = {}
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: '20px', ...style }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: colors.textSecondary,
        }}>
          {label} {required && <span style={{ color: colors.danger }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: '14px 40px 14px 16px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            background: colors.card,
            border: `2px solid ${error ? colors.danger : focused ? colors.primary : colors.border}`,
            borderRadius: '12px',
            color: value ? colors.text : colors.textMuted,
            outline: 'none',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            appearance: 'none',
          }}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown 
          size={18}
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: colors.textMuted,
            pointerEvents: 'none',
          }}
        />
      </div>
      {error && (
        <p style={{ 
          marginTop: '6px', 
          fontSize: '12px', 
          color: colors.danger,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <AlertCircle size={14} /> {error}
        </p>
      )}
    </div>
  );
};

// ============================================
// TEXTAREA COMPONENT
// ============================================
export const Textarea = ({ 
  label, 
  value, 
  onChange, 
  placeholder,
  rows = 4,
  error,
  disabled = false,
  required = false,
  style = {}
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: '20px', ...style }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: colors.textSecondary,
        }}>
          {label} {required && <span style={{ color: colors.danger }}>*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: '14px 16px',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          background: colors.card,
          border: `2px solid ${error ? colors.danger : focused ? colors.primary : colors.border}`,
          borderRadius: '12px',
          color: colors.text,
          outline: 'none',
          transition: 'all 0.3s ease',
          resize: 'vertical',
          minHeight: '100px',
        }}
      />
      {error && (
        <p style={{ 
          marginTop: '6px', 
          fontSize: '12px', 
          color: colors.danger,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <AlertCircle size={14} /> {error}
        </p>
      )}
    </div>
  );
};

// ============================================
// CARD COMPONENT
// ============================================
export const Card = ({ 
  children, 
  title,
  subtitle,
  icon: Icon,
  action,
  padding = true,
  hover = false,
  gradient = false,
  style = {}
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: gradient ? colors.gradient : colors.card,
        borderRadius: '20px',
        border: `1px solid ${colors.border}`,
        padding: padding ? '24px' : '0',
        transition: 'all 0.3s ease',
        transform: hover && isHovered ? 'translateY(-4px)' : 'none',
        boxShadow: hover && isHovered ? colors.shadow : 'none',
        ...style,
      }}
    >
      {(title || Icon || action) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: subtitle ? '4px' : '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {Icon && (
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: gradient ? 'rgba(255,255,255,0.2)' : 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: gradient ? '#fff' : colors.primary,
              }}>
                <Icon size={22} />
              </div>
            )}
            {title && (
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: gradient ? '#fff' : colors.text,
              }}>
                {title}
              </h3>
            )}
          </div>
          {action}
        </div>
      )}
      {subtitle && (
        <p style={{
          fontSize: '14px',
          color: gradient ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
          marginBottom: '20px',
          marginLeft: Icon ? '56px' : '0',
        }}>
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
};

// ============================================
// STAT CARD COMPONENT
// ============================================
export const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  color = 'primary',
  style = {}
}) => {
  const colorMap = {
    primary: { bg: 'rgba(99, 102, 241, 0.1)', color: colors.primary, gradient: colors.gradient },
    success: { bg: 'rgba(16, 185, 129, 0.1)', color: colors.secondary, gradient: colors.gradientGreen },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', color: colors.warning, gradient: colors.gradientOrange },
    danger: { bg: 'rgba(239, 68, 68, 0.1)', color: colors.danger, gradient: colors.gradientRed },
  };

  return (
    <div style={{
      background: colors.card,
      borderRadius: '20px',
      border: `1px solid ${colors.border}`,
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        background: colorMap[color].bg,
        borderRadius: '50%',
        filter: 'blur(40px)',
      }} />
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        position: 'relative',
      }}>
        <div>
          <p style={{
            fontSize: '14px',
            color: colors.textSecondary,
            marginBottom: '8px',
            fontWeight: '500',
          }}>
            {title}
          </p>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: colors.text,
            marginBottom: '8px',
          }}>
            {value}
          </h2>
          {trend && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              color: trend > 0 ? colors.secondary : colors.danger,
            }}>
              <TrendingUp size={14} style={{ transform: trend < 0 ? 'rotate(180deg)' : 'none' }} />
              {Math.abs(trend)}% from last month
            </div>
          )}
        </div>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: colorMap[color].gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: `0 8px 20px ${colorMap[color].bg}`,
        }}>
          <Icon size={26} />
        </div>
      </div>
    </div>
  );
};

// ============================================
// MODAL COMPONENT
// ============================================
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'medium',
  showClose = true
}) => {
  if (!isOpen) return null;

  const sizeMap = {
    small: '400px',
    medium: '500px',
    large: '700px',
    xlarge: '900px',
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        background: colors.dark,
        borderRadius: '24px',
        border: `1px solid ${colors.border}`,
        width: '100%',
        maxWidth: sizeMap[size],
        maxHeight: '90vh',
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: colors.text,
          }}>
            {title}
          </h2>
          {showClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: colors.textMuted,
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          maxHeight: 'calc(90vh - 70px)',
        }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ============================================
// TABLE COMPONENT
// ============================================
export const Table = ({ 
  columns, 
  data,
  loading = false,
  emptyMessage = 'No data available'
}) => {
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        color: colors.textMuted,
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(99, 102, 241, 0.2)',
          borderTopColor: colors.primary,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        color: colors.textMuted,
      }}>
        <FileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
      }}>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} style={{
                padding: '16px',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: '600',
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderBottom: `1px solid ${colors.border}`,
                whiteSpace: 'nowrap',
              }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} style={{
              transition: 'background 0.3s ease',
            }}>
              {columns.map((col, colIdx) => (
                <td key={colIdx} style={{
                  padding: '16px',
                  fontSize: '14px',
                  color: colors.text,
                  borderBottom: `1px solid ${colors.border}`,
                }}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// BADGE COMPONENT
// ============================================
export const Badge = ({ children, variant = 'primary', size = 'medium' }) => {
  const variantStyles = {
    primary: { background: 'rgba(99, 102, 241, 0.15)', color: colors.primary },
    success: { background: 'rgba(16, 185, 129, 0.15)', color: colors.secondary },
    warning: { background: 'rgba(245, 158, 11, 0.15)', color: colors.warning },
    danger: { background: 'rgba(239, 68, 68, 0.15)', color: colors.danger },
    neutral: { background: 'rgba(148, 163, 184, 0.15)', color: colors.textSecondary },
  };

  const sizeStyles = {
    small: { padding: '4px 8px', fontSize: '11px' },
    medium: { padding: '6px 12px', fontSize: '12px' },
    large: { padding: '8px 16px', fontSize: '13px' },
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      borderRadius: '20px',
      fontWeight: '600',
      textTransform: 'capitalize',
      ...variantStyles[variant],
      ...sizeStyles[size],
    }}>
      {children}
    </span>
  );
};

// ============================================
// AVATAR COMPONENT
// ============================================
export const Avatar = ({ name, size = 40, image, style = {} }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
  
  const colors_array = [
    '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', 
    '#f59e0b', '#ef4444', '#3b82f6', '#10b981'
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors_array.length : 0;

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: image ? `url(${image}) center/cover` : colors_array[colorIndex],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.4,
      fontWeight: '600',
      color: '#fff',
      flexShrink: 0,
      ...style,
    }}>
      {!image && initials}
    </div>
  );
};

// ============================================
// TOAST COMPONENT
// ============================================
export const Toast = ({ message, type = 'info', onClose }) => {
  const typeStyles = {
    success: { background: colors.gradientGreen, icon: Check },
    error: { background: colors.gradientRed, icon: X },
    warning: { background: colors.gradientOrange, icon: AlertCircle },
    info: { background: colors.gradient, icon: AlertCircle },
  };

  const IconComponent = typeStyles[type].icon;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: typeStyles[type].background,
      color: '#fff',
      padding: '16px 24px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: colors.shadow,
      zIndex: 2000,
      animation: 'slideIn 0.3s ease',
    }}>
      <IconComponent size={20} />
      <span style={{ fontWeight: '500' }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: '6px',
          padding: '4px',
          cursor: 'pointer',
          display: 'flex',
          marginLeft: '8px',
        }}
      >
        <X size={16} color="#fff" />
      </button>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

// ============================================
// TABS COMPONENT
// ============================================
export const Tabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      background: colors.card,
      padding: '6px',
      borderRadius: '14px',
      marginBottom: '24px',
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '12px 20px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === tab.id ? colors.gradient : 'transparent',
            color: activeTab === tab.id ? '#fff' : colors.textSecondary,
            fontWeight: '500',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {tab.icon && <tab.icon size={18} />}
          {tab.label}
          {tab.count !== undefined && (
            <span style={{
              background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : colors.border,
              padding: '2px 8px',
              borderRadius: '20px',
              fontSize: '12px',
            }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// ============================================
// FILE UPLOAD COMPONENT
// ============================================
export const FileUpload = ({ onFileSelect, accept = '.csv', label = 'Upload CSV File' }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragActive ? colors.primary : colors.border}`,
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
        background: dragActive ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
        id="file-upload"
      />
      <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
        <Upload size={48} color={colors.primary} style={{ marginBottom: '16px' }} />
        <p style={{ color: colors.text, fontWeight: '500', marginBottom: '8px' }}>
          {fileName || label}
        </p>
        <p style={{ color: colors.textMuted, fontSize: '13px' }}>
          Drag and drop or click to browse
        </p>
      </label>
    </div>
  );
};

// ============================================
// EMPTY STATE COMPONENT
// ============================================
export const EmptyState = ({ 
  icon: Icon = FileText, 
  title = 'No data found', 
  description = 'There is nothing to display here.',
  action
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'rgba(99, 102, 241, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
      }}>
        <Icon size={36} color={colors.primary} />
      </div>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: colors.text,
        marginBottom: '8px',
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '14px',
        color: colors.textMuted,
        maxWidth: '300px',
        marginBottom: action ? '24px' : '0',
      }}>
        {description}
      </p>
      {action}
    </div>
  );
};

// Export all icons for use in other components
export const Icons = {
  Home, Users, Activity, CheckCircle, XCircle, Plus, LogOut, 
  Award, FileText, Calendar, Upload, Clock, Eye, Shield, Menu,
  ChevronDown, Search, Bell, Settings, TrendingUp, Star, User,
  BookOpen, Briefcase, X, Check, AlertCircle, Download
};