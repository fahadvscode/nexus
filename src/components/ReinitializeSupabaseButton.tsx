import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const ReinitializeSupabaseButton = () => {
  const { toast } = useToast();

  const handleReinitialize = async () => {
    try {
      console.log('🔄 Manually re-initializing Supabase client...');
      
      // You might need a more specific re-initialization logic
      // For now, let's try something simple
      await supabase.auth.refreshSession();
      
      toast({
        title: "Supabase Re-initialized",
        description: "Attempted to refresh the Supabase session.",
      });
    } catch (error) {
      toast({
        title: "Re-initialization Failed",
        description: "Could not re-initialize Supabase.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={handleReinitialize} variant="outline" size="sm">
      Re-init Supabase
    </Button>
  );
}; 