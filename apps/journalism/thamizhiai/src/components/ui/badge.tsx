import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow',
        outline: 'text-foreground',
        blue: 'border-transparent bg-blue-50 text-blue-700',
        amber: 'border-transparent bg-amber-50 text-amber-700',
        red: 'border-transparent bg-red-50 text-red-700',
        green: 'border-transparent bg-green-50 text-green-700',
        purple: 'border-transparent bg-purple-50 text-purple-700',
        teal: 'border-transparent bg-teal-50 text-teal-700',
        rose: 'border-transparent bg-rose-50 text-rose-700',
        emerald: 'border-transparent bg-emerald-50 text-emerald-700',
        orange: 'border-transparent bg-orange-50 text-orange-700',
        lime: 'border-transparent bg-lime-50 text-lime-700',
        cyan: 'border-transparent bg-cyan-50 text-cyan-700',
        violet: 'border-transparent bg-violet-50 text-violet-700',
        pink: 'border-transparent bg-pink-50 text-pink-700',
        muted: 'border-transparent bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
