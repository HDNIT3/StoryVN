'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/context/AuthContext';
import { discoveryService } from '../services/discovery.service';

export function useRecommendations(storyId?: string, enabled = true) {
  const { user, isAuthenticated } = useAuth();
  const query = useQuery({
    queryKey: ['stories', 'recommendations', user?._id ?? 'guest', storyId ?? 'home'],
    queryFn: async () => (await discoveryService.recommendations(storyId)).data,
    enabled: enabled && isAuthenticated && Boolean(user?._id),
    staleTime: 60_000,
    gcTime: 0,
    retry: 1,
  });
  return { ...query, data: isAuthenticated && user?._id ? query.data : undefined };
}
