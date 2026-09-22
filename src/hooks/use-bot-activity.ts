import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createTenantScopedClient } from '@/lib/supabase/tenant-client';
import { createClient } from '@/lib/supabase/client';

export function useBotActivity() {
  const { user, perfil } = useAuth();
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [isOperative, setIsOperative] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !perfil?.empresa_id) {
      setLoading(false);
      return;
    }

    const fetchActivity = async () => {
      try {
        const supabase = createClient();
        const client = createTenantScopedClient(supabase);
        const activity = await client.getLastActivity();
        setLastActivity(activity);

        if (activity) {
          const activityDate = new Date(activity);
          const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
          setIsOperative(activityDate > twoHoursAgo);
        } else {
          setIsOperative(false);
        }
      } catch (err) {
        console.error('Error fetching bot activity:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 60000);
    return () => clearInterval(interval);
  }, [user, perfil?.empresa_id]);

  return { lastActivity, isOperative, loading };
}
