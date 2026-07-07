import React from 'react';
import { redirect } from 'next/navigation';
import { createServerClientInstance } from '@/lib/supabase/server';
import DashboardSidebar from './sidebar';
import { ThemeProvider } from '@/components/ui/theme-provider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClientInstance();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
      <div className="min-h-screen flex font-sans">
        <DashboardSidebar userEmail={user.email || 'admin@relayops.com'} />
        <main className="flex-1 overflow-y-auto h-screen relative">
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </ThemeProvider>
  );
}
