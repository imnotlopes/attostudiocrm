interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  className?: string
}

export default function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' },
    success: { background: 'var(--color-success-soft)', color: 'var(--color-success)' },
    warning: { background: 'var(--color-warning-soft)', color: 'var(--color-warning)' },
    danger:  { background: 'var(--color-danger-soft)',  color: 'var(--color-danger)' },
    info:    { background: 'var(--color-surface-2)',    color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' },
  }

  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md ${sizeClass} ${className}`}
      style={styles[variant]}
    >
      {children}
    </span>
  )
}
