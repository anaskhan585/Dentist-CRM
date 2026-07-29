import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './toast.jsx';

/**
 * Wraps a create/update call with the three things every form here needs:
 * field-level errors from the API, a toast, and cache invalidation.
 */
export function useSaveMutation({ mutationFn, invalidate = [], successMessage, onSuccess }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [fieldErrors, setFieldErrors] = useState({});

  const mutation = useMutation({
    mutationFn: async (payload) => {
      setFieldErrors({});
      return mutationFn(payload);
    },
    onSuccess: (data) => {
      for (const key of invalidate) {
        queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
      }
      if (successMessage) toast.success(successMessage);
      onSuccess?.(data);
    },
    onError: (error) => {
      if (error.fieldErrors) setFieldErrors(error.fieldErrors);
      toast.error(error.friendlyMessage ?? 'Could not save your changes');
    },
  });

  return { ...mutation, fieldErrors, clearFieldErrors: () => setFieldErrors({}) };
}
