'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ApplicationsAnalytics = dynamic(() => import('@/components/ApplicationsAnalytics'), {
    loading: () => (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    ),
    ssr: false
});

export default function AdminApplicationsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return; // Still loading

        if (!session) {
            router.push('/login');
            return;
        }

        // Check if user is admin (using the specific email)
        if (session.user?.email !== 'hapuarachchikaviru@gmail.com') {
            router.push('/dashboard');
            return;
        }
    }, [session, status, router]);

    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!session || session.user?.email !== 'hapuarachchikaviru@gmail.com') {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="container mx-auto max-w-7xl py-10 px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-center mb-2">Applications Analytics</h1>
                <p className="text-center text-gray-600 dark:text-gray-400">
                    Monitor and manage Ladder program applications
                </p>
            </div>

            <ApplicationsAnalytics />
        </div>
    );
}
