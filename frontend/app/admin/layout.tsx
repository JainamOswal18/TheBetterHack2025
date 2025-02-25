'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import AdminAuth from '@/components/AdminAuth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);

      // Subscribe to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setIsAuthenticated(!!session);
      });

      return () => subscription.unsubscribe();
    };

    checkAuth();
  }, []);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <AdminAuth />;
  }

  // Show admin content if authenticated
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
} 