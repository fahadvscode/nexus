// components/TwilioAuthListener.tsx
import { useEffect } from 'react';
import { useTwilioStore } from '@/hooks/useTwilioStore';
import { supabase } from '@/integrations/supabase/client';

export const TwilioAuthListener = () => {
  const { initializeDevice, destroyDevice, isReady, isInitializing, audioUnlocked } = useTwilioStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth state changed: ${event}`, session ? '(Session exists)' : '(No session)');
      console.log('Current audio state:', { audioUnlocked, isReady, isInitializing });

      const shouldInitialize = session && !isReady && !isInitializing && audioUnlocked;

      if (shouldInitialize) {
        console.log(`Auth event '${event}' triggered: Initializing Twilio device...`);
        initializeDevice();
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, destroying Twilio device.');
        destroyDevice();
      } else if (session && !audioUnlocked) {
        console.log('Session active, but audio is locked. Waiting for user interaction.');
      } else if (session && (isReady || isInitializing)) {
        console.log(`Device already ready or initializing, skipping initialization for ${event}...`);
      }
    });

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [initializeDevice, destroyDevice, isReady, isInitializing, audioUnlocked]);

  // Also try to initialize when audio is unlocked, in case auth state was already settled
  useEffect(() => {
    if (audioUnlocked && !isReady && !isInitializing) {
      console.log('🔓 Audio unlocked detected, attempting to initialize device...');
      // We need to check for a session here too
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          console.log('✅ Session found, initializing device...');
          initializeDevice();
        } else {
          console.log('❌ No session found, cannot initialize device.');
        }
      }).catch(error => {
        console.error('Error checking session:', error);
      });
    }
  }, [audioUnlocked, isReady, isInitializing, initializeDevice]);

  return null;
};
