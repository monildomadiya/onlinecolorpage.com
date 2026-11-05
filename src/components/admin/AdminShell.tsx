'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  ExternalLink,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Palette,
  Settings,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { CrayonMark } from '@/components/ui/Decor';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/db';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Match the path exactly rather than by prefix. */
  exact: boolean;
  min: Role;
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true, min: 'editor' },
  { href: '/admin/pages', label: 'Coloring pages', icon: Palette, exact: false, min: 'editor' },
  { href: '/admin/upload', label: 'Bulk upload', icon: Upload, exact: false, min: 'editor' },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree, exact: false, min: 'editor' },
  { href: '/admin/media', label: 'Media library', icon: ImageIcon, exact: false, min: 'editor' },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, exact: false, min: 'editor' },
  { href: '/admin/ads', label: 'Ads', icon: Megaphone, exact: false, min: 'admin' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, exact: false, min: 'admin' },
  { href: '/admin/users', label: 'Users', icon: Users, exact: false, min: 'admin' },
];

const RANK: Record<Role, number> = { viewer: 0, editor: 1, admin: 2 };

export function AdminShell({
  email,
  name,
  role,
  onSignOut,
  children,
}: {
  email: string;
  name: string;
  role: Role;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const items = NAV.filter((item) => RANK[role] >= RANK[item.min]);

  const nav = (
    <nav aria-label="Admin sections" className="space-y-1">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-bold transition',
              active
                ? 'border-ink/10 bg-grape-600 text-white'
                : 'border-transparent text-slate-600 hover:border-ink/20 hover:bg-cream-deep hover:text-slate-900',
            )}
          >
            <Icon className="size-4.5 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh text-slate-900">
      {/* ---------------- top bar ---------------- */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-white">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="grid size-10 place-items-center rounded-2xl text-slate-600 transition hover:bg-cream-deep lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-2xl bg-grape-600 text-white">
              <CrayonMark className="size-5" />
            </span>
            <span className="text-sm leading-tight font-extrabold">
              Online Color Page
              <span className="block text-[11px] font-bold text-slate-400 uppercase">
                Admin panel
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:-translate-y-0.5 hover:bg-cream-deep sm:inline-flex"
            >
              View site
              <ExternalLink className="size-3.5" aria-hidden />
            </Link>

            <div className="hidden text-right sm:block">
              <p className="max-w-40 truncate text-xs font-extrabold text-slate-800">{name}</p>
              <p className="max-w-40 truncate text-[11px] text-slate-400">
                {email} · {role}
              </p>
            </div>

            <form action={onSignOut}>
              <button
                type="submit"
                title="Sign out"
                className="grid size-10 place-items-center rounded-2xl text-slate-500 transition hover:bg-rose-50/80 hover:text-rose-600"
              >
                <LogOut className="size-4.5" aria-hidden />
                <span className="sr-only">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[100rem] gap-6 px-4 py-6 sm:px-6">
        {/* ---------------- sidebar ---------------- */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-22">{nav}</div>
        </aside>

        {/* ---------------- mobile drawer ---------------- */}
        {open && (
          <>
            <div
              className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <aside className="fixed top-16 bottom-0 left-0 z-40 w-64 overflow-y-auto border-r border-ink/10 bg-white p-4 lg:hidden">
              {nav}
            </aside>
          </>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
