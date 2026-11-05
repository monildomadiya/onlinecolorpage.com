import Link from 'next/link';
import { cn } from '@/lib/utils';

export type ButtonTone = 'grape' | 'sunny' | 'coral' | 'mint' | 'sky' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const TONES: Record<ButtonTone, string> = {
  grape: 'btn-kid',
  sunny: 'btn-kid btn-sunny',
  coral: 'btn-kid btn-coral',
  mint: 'btn-kid btn-mint',
  sky: 'btn-kid btn-sky',
  ghost: 'btn-kid btn-ghost',
};

// Radius stays on the pill set by .btn-kid at every size - a capsule that
// changes shape as it grows reads as two different components.
const SIZES: Record<ButtonSize, string> = {
  sm: 'text-sm px-4 py-2',
  md: 'text-base px-6 py-3',
  lg: 'text-lg sm:text-xl px-8 py-4',
};

interface BaseProps {
  tone?: ButtonTone;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>;
type LinkProps = BaseProps & { href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    'href'
  >;

export function Button({ tone = 'grape', size = 'md', className, children, ...rest }: ButtonProps) {
  return (
    <button className={cn(TONES[tone], SIZES[size], 'tap-big', className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  tone = 'grape',
  size = 'md',
  className,
  children,
  href,
  ...rest
}: LinkProps) {
  return (
    <Link href={href} className={cn(TONES[tone], SIZES[size], 'tap-big', className)} {...rest}>
      {children}
    </Link>
  );
}
