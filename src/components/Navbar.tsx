import Link from 'next/link';
import { Car, LayoutDashboard, Settings, LogOut, BarChart3, Bell } from 'lucide-react';

export const Navbar = () => {
    return (
        <nav className="glass-card sticky top-0 z-50 !bg-slate-950/40 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="bg-blue-600 p-1.5 rounded-lg">
                                <Car className="text-white" size={24} />
                            </div>
                            <span className="font-black text-xl tracking-tight text-white uppercase italic">
                                PRIVATE CAR <span className="text-indigo-500">BUYER</span>
                            </span>
                        </Link>

                        <div className="hidden sm:flex items-center gap-6">
                            {[
                                { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                                { href: '/analytics', icon: BarChart3, label: 'Analytics' },
                                { href: '/settings', icon: Settings, label: 'Settings' }
                            ].map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-2 px-1 py-2 text-xs font-black uppercase tracking-[0.15em] text-slate-400 hover:text-indigo-400 transition-all duration-300 group"
                                >
                                    <item.icon size={16} className="group-hover:scale-110 transition-transform" />
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 relative transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                        </button>
                        <Link href="/login" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 transition-colors">
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Sign Out</span>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};
