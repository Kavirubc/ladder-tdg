'use client';

import { signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, User, Loader2, Shield, Menu } from 'lucide-react';
import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@/components/ui/sheet';

export default function Navbar() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

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
        <nav className='fixed top-2 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center w-[95%] sm:min-w-4xl'>
            <div className="bg-white border-b border-gray-200 w-full max-w-4xl rounded-lg shadow-sm">
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

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-4">
                            {/* Regular User Links */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/dashboard')}
                                className="flex items-center space-x-2"
                                data-ph-event="navbar_action"
                            >
                                <span>Dashboard</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/ladder')}
                                className="flex items-center space-x-2"
                                data-ph-event="navbar_action"
                            >
                                <span>Ladder</span>
                            </Button>

                            {/* Admin Links for desktop */}
                            {isAdmin && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleAdminClick}
                                        className="flex items-center space-x-2"
                                        data-ph-event="navbar_action"
                                    >
                                        <Shield className="h-4 w-4" />
                                        <span>Admin</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.push('/admin/applications')}
                                        className="flex items-center space-x-2"
                                        data-ph-event="navbar_action"
                                    >
                                        <span>Applications</span>
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Desktop User info and logout */}
                        <div className="hidden md:flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <User className="h-4 w-4" />
                                <span>{session.user?.name}</span>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="flex items-center space-x-2"
                                data-ph-event="navbar_action"
                            >
                                {isLoggingOut ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <LogOut className="h-4 w-4" />
                                )}
                                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                            </Button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open menu">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[80%] sm:w-[350px] pt-10">
                                    <div className="flex flex-col space-y-6">
                                        <div className="flex items-center mb-4">
                                            <User className="h-4 w-4 mr-2 text-primary" />
                                            <span className="font-medium">{session.user?.name}</span>
                                        </div>

                                        <div className="flex flex-col space-y-2">
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    router.push('/dashboard');
                                                    setIsOpen(false);
                                                }}
                                                className="justify-start"
                                            >
                                                Dashboard
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    router.push('/ladder');
                                                    setIsOpen(false);
                                                }}
                                                className="justify-start"
                                            >
                                                Ladder Submissions
                                            </Button>

                                            {isAdmin && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => {
                                                            handleAdminClick();
                                                            setIsOpen(false);
                                                        }}
                                                        className="justify-start"
                                                    >
                                                        <Shield className="h-4 w-4 mr-2" />
                                                        Admin Dashboard
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => {
                                                            router.push('/admin/applications');
                                                            setIsOpen(false);
                                                        }}
                                                        className="justify-start"
                                                    >
                                                        Applications
                                                    </Button>
                                                </>
                                            )}
                                        </div>

                                        <div className="border-t pt-4 mt-auto">
                                            <Button
                                                variant="outline"
                                                onClick={handleLogout}
                                                disabled={isLoggingOut}
                                                className="w-full justify-center"
                                            >
                                                {isLoggingOut ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        Logging out...
                                                    </>
                                                ) : (
                                                    <>
                                                        <LogOut className="h-4 w-4 mr-2" />
                                                        Logout
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
