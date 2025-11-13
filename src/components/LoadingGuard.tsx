import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface LoadingGuardProps {
  children: React.ReactNode;
  timeout?: number;
}

export function LoadingGuard({ children, timeout = 15000 }: LoadingGuardProps) {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    console.log('🔍 [LoadingGuard] Starting timeout timer:', timeout, 'ms');
    
    const timer = setTimeout(() => {
      console.error('🔍 [LoadingGuard] Loading timeout exceeded');
      setShowTimeout(true);
    }, timeout);

    return () => {
      console.log('🔍 [LoadingGuard] Cleanup timeout timer');
      clearTimeout(timer);
    };
  }, [timeout]);

  if (showTimeout) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <h2 className="text-2xl font-bold">Loading is taking longer than expected</h2>
          <p className="text-muted-foreground">
            The application is taking too long to load. This might be due to:
          </p>
          <ul className="text-sm text-left space-y-2 text-muted-foreground">
            <li>• A network connection issue</li>
            <li>• The authentication service being slow</li>
            <li>• Browser cache issues</li>
          </ul>
          <div className="flex flex-col gap-2 mt-4">
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
            >
              Clear Cache & Refresh
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

