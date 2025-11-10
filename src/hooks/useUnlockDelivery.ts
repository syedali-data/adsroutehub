import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useUnlockDelivery() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deliveryId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('unlock-delivery', {
        body: { deliveryId },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to unlock lead');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-recent-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['delivery'] });
      toast({
        title: "Lead unlocked!",
        description: "Full contact details are now available. Check your email for details.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to unlock",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
