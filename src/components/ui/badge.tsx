import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: string
}

export function Badge({ className, children, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border',
        variant || 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
