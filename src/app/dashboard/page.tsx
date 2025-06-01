import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import IntegratedDashboard from '@/components/IntegratedDashboard';
import '@/styles/dashboard.css';
import '@/styles/a11y.css';
import '@/styles/patterns.css';

export default async function DashboardPage() {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Add class to body for dashboard-specific styling
  return (
    <>
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <div className="dashboard-container">
        <div className="welcome-banner">
          <h1>
            Welcome, <span className="text-indigo-600">{session.user.name}</span>
          </h1>
          <p className="text-gray-500">Your personalized dashboard to track progress and manage activities</p>
        </div>

        {/* Enhanced Application Banner with cleaner design */}
        <div className="application-banner">
          <div className="application-banner-content">
            <h2 className="flex items-center gap-2">
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              Ladder Program Applications Now Open
            </h2>
            <p>Join our community today and take your goals to the next level</p>
          </div>
          <a href="/apply">
            <button className="application-banner-btn" aria-label="Apply to the Ladder Program">
              <span>Apply Now</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </button>
          </a>
        </div>

        <div id="main-content" className="animate-fade-in">
          <IntegratedDashboard userId={session.user.id} />
        </div>
      </div>
    </>
  );
}
