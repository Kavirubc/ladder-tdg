'use client';

import { signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, User, Loader2, Shield } from 'lucide-react';
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
            const callbackUrl = `${window.location.origin}/login`;
            await signOut({
                callbackUrl,
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

    const handleAdminClick = () => {
        router.push('/admin/dashboard');
    };

    const isAdmin = session.user?.email === 'hapuarachchikaviru@gmail.com';

    return (
        <nav className='fixed top-2 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center min-w-4xl '>
            <div className="bg-white border-b border-gray-200 w-full max-w-4xl rounded-lg">
                <div className="container mx-auto px-4">
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
                            {/* Apply Link for regular users */}
                            {!isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push('/apply')}
                                    className="flex items-center space-x-2"
                                >
                                    <span className="hidden sm:inline">Apply to Ladder</span>
                                    <span className="sm:hidden">Apply</span>
                                </Button>
                            )}

                            {/* Admin Links */}
                            {isAdmin && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleAdminClick}
                                        className="flex items-center space-x-2"
                                    >
                                        <Shield className="h-4 w-4" />
                                        <span className="hidden sm:inline">Dashboard</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.push('/admin/applications')}
                                        className="flex items-center space-x-2"
                                    >
                                        <span className="hidden sm:inline">Applications</span>
                                        <span className="sm:hidden">Apps</span>
                                    </Button>
                                </>
                            )}
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
            </div>
        </nav>
    );
}
