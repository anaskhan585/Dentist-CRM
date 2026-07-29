import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconClose, IconInbox } from '../../lib/icons.jsx';
import { colourFor, initials as toInitials } from '../../lib/format.js';

/* --- Buttons -------------------------------------------------------------- */

export function Button({ variant = 'secondary', size, loading, icon: Icon, children, className = '', ...props }) {
  return (
    <button
      className={`btn btn--${variant}${size === 'sm' ? ' btn--sm' : ''} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="spinner" /> : Icon ? <Icon /> : null}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, ...props }) {
  return (
    <button className="icon-btn" aria-label={label} title={label} {...props}>
      <Icon />
    </button>
  );
}

/* --- Display -------------------------------------------------------------- */

export function Badge({ tone = 'neutral', dot, children }) {
  return (
    <span className="badge" data-tone={tone}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
}

export function Avatar({ name = '', initials, colour, size, style, ...props }) {
  const text = initials ?? toInitials(name);
  return (
    <span
      className={`avatar${size ? ` avatar--${size}` : ''}`}
      style={{ background: colour ?? colourFor(name), ...style }}
      title={name || undefined}
      {...props}
    >
      {text || '—'}
    </span>
  );
}

export function Card({ children, className = '', flush, ...props }) {
  return (
    <section className={`card${flush ? ' card--flush' : ''} ${className}`} {...props}>
      {children}
    </section>
  );
}

export function CardHead({ title, sub, children }) {
  return (
    <header className="card__head">
      <div>
        <h2 className="card__title">{title}</h2>
        {sub && <p className="card__sub">{sub}</p>}
      </div>
      {children}
    </header>
  );
}

export function PageHead({ title, sub, children }) {
  return (
    <header className="page-head">
      <div>
        <h1 className="page-head__title">{title}</h1>
        {sub && <p className="page-head__sub">{sub}</p>}
      </div>
      {children && <div className="page-head__actions">{children}</div>}
    </header>
  );
}

export function EmptyState({ icon: Icon = IconInbox, title, text, children }) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <Icon />
      </span>
      <p className="empty__title">{title}</p>
      {text && <p className="empty__text">{text}</p>}
      {children}
    </div>
  );
}

export function Skeleton({ height = 16, width = '100%', radius, style }) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius, ...style }} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <tbody>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: cols }, (_, colIndex) => (
            <td key={colIndex}>
              <Skeleton height={13} width={colIndex === 0 ? '70%' : '48%'} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

/* --- Form primitives ------------------------------------------------------ */

export function Field({ label, required, hint, error, children, className = '', style }) {
  return (
    <label className={`field ${className}`} style={style}>
      {label && (
        <span className="field__label">
          {label}
          {required && <span aria-hidden="true">*</span>}
        </span>
      )}
      {children}
      {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

export function Input({ error, ...props }) {
  return <input className="input" aria-invalid={error ? 'true' : undefined} {...props} />;
}

export function Textarea({ error, ...props }) {
  return <textarea className="textarea" aria-invalid={error ? 'true' : undefined} {...props} />;
}

export function Select({ error, children, ...props }) {
  return (
    <select className="select" aria-invalid={error ? 'true' : undefined} {...props}>
      {children}
    </select>
  );
}

export function Switch({ checked, onChange, title, description }) {
  return (
    <div className="switch">
      <div className="switch__text">
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className="switch__control"
        data-on={checked}
        onClick={() => onChange(!checked)}
      >
        <span className="switch__knob" />
      </button>
    </div>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented" role="group">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* --- Modal ---------------------------------------------------------------- */

export function Modal({ open, onClose, title, sub, size, children, footer }) {
  const scrimRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-scrim"
      ref={scrimRef}
      onMouseDown={(event) => {
        if (event.target === scrimRef.current) onClose();
      }}
    >
      <div className={`modal${size ? ` modal--${size}` : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal__head">
          <div>
            <h2 className="modal__title">{title}</h2>
            {sub && <p className="modal__sub">{sub}</p>}
          </div>
          <IconButton icon={IconClose} label="Close" onClick={onClose} />
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

/* --- Pagination ----------------------------------------------------------- */

export function Pagination({ meta, onChange }) {
  if (!meta || meta.pages <= 1) return null;

  const { page, pages, total, limit } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Show a compact window around the current page rather than every number.
  const numbers = [];
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i += 1) numbers.push(i);

  return (
    <div className="pagination">
      <span>
        Showing <strong>{from}–{to}</strong> of {total}
      </span>
      <div className="pagination__controls">
        <button className="pagination__btn" onClick={() => onChange(page - 1)} disabled={page === 1}>
          Prev
        </button>
        {start > 1 && <span className="pagination__btn" style={{ pointerEvents: 'none' }}>…</span>}
        {numbers.map((n) => (
          <button
            key={n}
            className="pagination__btn"
            aria-current={n === page ? 'true' : undefined}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
        {end < pages && <span className="pagination__btn" style={{ pointerEvents: 'none' }}>…</span>}
        <button className="pagination__btn" onClick={() => onChange(page + 1)} disabled={page === pages}>
          Next
        </button>
      </div>
    </div>
  );
}

/* --- Dropdown ------------------------------------------------------------- */

export function Dropdown({ trigger, children, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      {open && (
        <div className="menu" style={align === 'left' ? { right: 'auto', left: 0 } : undefined} onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}
