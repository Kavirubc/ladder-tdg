import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Image from "next/image";
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function Home() {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);

  // If user is already logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="grid items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
      <main className="flex flex-col gap-8 items-center max-w-3xl text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Welcome to <span className="text-primary">Ladder</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Your personal productivity tool for tracking tasks and achieving your goals. Join our community program and climb the ladder to success.
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-4">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="p-6 rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-2">Track Tasks</h2>
            <p className="text-muted-foreground">Keep track of your daily tasks and progress with our intuitive interface.</p>
          </div>
          <div className="p-6 rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-2">Measure Progress</h2>
            <p className="text-muted-foreground">Visualize your achievements and stay motivated throughout your journey.</p>
          </div>
          <div className="p-6 rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-2">Community Support</h2>
            <p className="text-muted-foreground">Be part of a community of 15 people working towards their goals together.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
