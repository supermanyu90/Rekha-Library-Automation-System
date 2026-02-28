import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

type ConnectionState = 'connected' | 'disconnected' | 'checking';

export default function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionState>('checking');
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [retryCount, setRetryCount] = useState(0);

  const checkConnection = async () => {
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1).maybeSingle();

      if (error && error.message.includes('Failed to fetch')) {
        setStatus('disconnected');
        setRetryCount(prev => prev + 1);
      } else {
        setStatus('connected');
        setRetryCount(0);
      }
    } catch (err) {
      setStatus('disconnected');
      setRetryCount(prev => prev + 1);
    } finally {
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkConnection();

    const interval = setInterval(() => {
      checkConnection();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (status === 'connected') {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${
      status === 'disconnected' ? 'bg-red-600' : 'bg-yellow-600'
    } text-white px-4 py-3 shadow-lg`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status === 'disconnected' ? (
            <WifiOff className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <div>
            <p className="font-semibold">
              {status === 'disconnected'
                ? 'Connection Lost - Unable to reach server'
                : 'Checking connection...'}
            </p>
            <p className="text-sm opacity-90">
              {status === 'disconnected' && (
                <>
                  This might be due to a service outage in your region.
                  {retryCount > 0 && ` Retry attempt: ${retryCount}`}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={checkConnection}
            className="px-4 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors text-sm font-medium"
          >
            Retry Now
          </button>
          <div className="text-xs opacity-75">
            Last checked: {lastChecked.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}
