'use client';

import { signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, User, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Don't show navbar on auth pages
    const isAuthPage = pathname === '/login' || pathname === '/register';

    // Don't render anything during loading or on auth pages
    if (status === 'loading' || isAuthPage) {
        return null;
    }

    // Don't show navbar if user is not authenticated
    if (status === 'unauthenticated' || !session) {
        return null;
    }

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await signOut({
                callbackUrl: '/login',
                redirect: true
            });
        } catch (error) {
            console.error('Logout error:', error);
            setIsLoggingOut(false);
        }
    };

    const handleBrandClick = () => {
        router.push('/dashboard');
    };

    return (
        <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="container mx-auto max-w-4xl px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center space-x-2">
                        <h1
                            className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-gray-700 transition-colors"
                            onClick={handleBrandClick}
                        >
                            Ladder
                        </h1>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/dashboard')}
                            className={`${pathname === '/dashboard'
                                    ? 'font-semibold text-primary'
                                    : 'text-gray-600'
                                }`}
                        >
                            Dashboard
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/tasks')}
                            className={`${pathname === '/tasks'
                                    ? 'font-semibold text-primary'
                                    : 'text-gray-600'
                                }`}
                        >
                            Tasks
                        </Button>
                    </div>

                    {/* User info and logout */}
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span className="hidden sm:inline">
                                {session.user?.name}
                            </span>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="flex items-center space-x-2"
                        >
                            {isLoggingOut ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <LogOut className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">
                                {isLoggingOut ? 'Logging out...' : 'Logout'}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
