import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    ChevronsLeft,
    ChevronsRight,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useServerStore } from '@/store/serverStore';

const NAV = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export function AppLayout() {
    const { servers, health } = useServerStore();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen">
            {/* ── Sidebar ── */}
            <aside
                className={cn(
                    'flex flex-col border-r border-slate-700/50 bg-slate-900/60 backdrop-blur-xl transition-all duration-300',
                    collapsed ? 'w-16' : 'w-56',
                )}
            >
                {/* Logo */}
                <div className={cn('flex items-center border-b border-slate-700/50 px-4 py-4', collapsed && 'justify-center px-0')}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/20 shrink-0">
                        <Zap className="h-4 w-4 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="ml-2.5 min-w-0">
                            <span className="block text-sm font-bold gradient-text">Syncthing</span>
                            <span className="block text-[10px] text-slate-400 -mt-0.5 font-medium tracking-widest uppercase">
                                Central
                            </span>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 space-y-0.5 p-2">
                    {NAV.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                                    collapsed && 'justify-center px-0',
                                    isActive
                                        ? 'bg-brand-600/20 text-brand-300 font-medium'
                                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200',
                                )
                            }
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            {!collapsed && label}
                        </NavLink>
                    ))}

                    {/* Server shortcuts */}
                    {!collapsed && servers.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700/40">
                            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                                Servers
                            </p>
                            {servers.map((srv) => {
                                const status = health[srv.id]?.status ?? 'loading';
                                return (
                                    <NavLink
                                        key={srv.id}
                                        to={`/server/${srv.id}`}
                                        className={({ isActive }) =>
                                            cn(
                                                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-all',
                                                isActive
                                                    ? 'bg-brand-600/20 text-brand-300'
                                                    : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200',
                                            )
                                        }
                                    >
                                        <span
                                            className={cn(
                                                'status-dot shrink-0',
                                                status === 'online'
                                                    ? 'status-dot-online'
                                                    : status === 'auth_error'
                                                        ? 'status-dot-auth_error'
                                                        : status === 'loading'
                                                            ? 'status-dot-loading'
                                                            : 'status-dot-offline',
                                            )}
                                        />
                                        <span className="truncate">{srv.name || srv.url}</span>
                                    </NavLink>
                                );
                            })}
                        </div>
                    )}
                </nav>

                {/* Collapse toggle */}
                <button
                    className="flex items-center justify-center border-t border-slate-700/50 py-3 text-slate-500 hover:text-slate-300 transition-colors"
                    onClick={() => setCollapsed((v) => !v)}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? (
                        <ChevronsRight className="h-4 w-4" />
                    ) : (
                        <ChevronsLeft className="h-4 w-4" />
                    )}
                </button>
            </aside>

            {/* ── Main ── */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
