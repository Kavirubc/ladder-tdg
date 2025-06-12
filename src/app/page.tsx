'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  // Client components cannot use getServerSession or authOptions directly
  // If you need session info, use useSession from 'next-auth/react'

  return (
    <>
      {/* <div className="w-full fixed top-0 left-0 z-50 flex justify-center">
        <div className="bg-green-600 text-white px-6 py-2 flex flex-row items-center justify-center gap-4 w-full max-w-screen text-center">
          <span className="text-center">🚀 Application Open Now! Apply today to join the Ladder community.</span>
          <Link href="/apply">
            <Button size="sm" variant="secondary" className="text-green-700 bg-white hover:bg-green-100">
              Apply Now
            </Button>
          </Link>
        </div>
      </div> */}
      <div className="grid items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 pt-20">
        {/* Application Open Now Banner */}

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
    </>
  )
}
