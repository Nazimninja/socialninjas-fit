import React from 'react';
import Icon from './Icon';

export function Section({
  title,
  footer,
  children,
  className = '',
}: {
  title?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={'sect ' + className}>
      {title && <h2 className="sect-t">{title}</h2>}
      <div className="sect-b">{children}</div>
      {footer && <p className="sect-f">{footer}</p>}
    </section>
  );
}

export function Row({
  icon,
  iconTint,
  avatar,
  title,
  subtitle,
  value,
  accessory = 'none',
  onClick,
  danger,
  children,
  className = '',
}: {
  icon?: string;
  iconTint?: string;
  avatar?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  value?: React.ReactNode;
  accessory?: 'none' | 'chevron' | 'check';
  onClick?: () => void;
  danger?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`lrow ${onClick ? 'tap' : ''} ${danger ? 'danger' : ''} ${className}`}
      onClick={onClick}
    >
      {avatar ? (
        <span
          className="lrow-i"
          style={{
            padding: 0,
            overflow: 'hidden',
            borderRadius: '50%',
            width: 34,
            height: 34,
            minWidth: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </span>
      ) : icon ? (
        <span
          className="lrow-i"
          style={iconTint ? ({ '--tint': iconTint } as React.CSSProperties) : undefined}
        >
          <Icon name={icon} />
        </span>
      ) : null}

      <span className="lrow-m">
        <span className="lrow-t">{title}</span>
        {subtitle && <span className="lrow-s">{subtitle}</span>}
      </span>

      {children}
      {value != null && <span className="lrow-v">{value}</span>}
      {accessory === 'chevron' && <Icon name="chevronRight" className="lrow-c" />}
      {accessory === 'check' && <Icon name="check" className="lrow-k" />}
    </Tag>
  );
}

export function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={!!checked}
      disabled={disabled}
      className={'sw' + (checked ? ' on' : '')}
      onClick={() => onChange(!checked)}
    >
      <span className="knob" />
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: {
  options: { value: T; label: string; icon?: string }[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
}) {
  return (
    <div className={'seg ' + className}>
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          className={o.value === value ? 'on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.icon && <Icon name={o.icon} className="inline mr-1" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
