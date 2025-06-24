import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { useTwilioStore } from '@/hooks/useTwilioStore';
import { useToast } from '@/hooks/use-toast';

export const CallTestButton = () => {
  const [testNumber] = useState('+1234567890');
  const { makeCall, isReady, isConnecting, activeCall, hangupCall, error, device } = useTwilioStore();
  const { toast } = useToast();

  const handleTestCall = async () => {
    try {
      await makeCall({
        phoneNumber: testNumber,
        clientName: 'Test Client',
        clientId: 'test-id'
      });
      
      toast({
        title: "Test Call Initiated",
        description: `Test call to ${testNumber} started`,
      });
    } catch (error) {
      toast({
        title: "Call Failed",
        description: "Failed to initiate test call",
        variant: "destructive",
      });
    }
  };

  const handleEndCall = () => {
    hangupCall();
    toast({
      title: "Call Ended",
      description: "Test call has been ended",
    });
  };

  const getStatusDisplay = () => {
    if (activeCall) {
      return '📞 Call Active';
    }
    if (isReady && device) {
      return '✅ Twilio Ready (Real Calls)';
    }
    if (isReady && !device) {
      return '🎭 Demo Mode Active';
    }
    if (error && !error.includes('Demo Mode')) {
      return '❌ Error: ' + error;
    }
    return '🔄 Initializing...';
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-medium mb-2">Twilio Calling Test</h3>
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Status: {getStatusDisplay()}
        </p>
        
        {device && (
          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
            ✅ Connected with credentials: AC193a26...72f | Phone: (289) 212-8389
          </div>
        )}
        
        <p className="text-sm text-gray-600">
          Test Number: {testNumber}
        </p>
        
        <div className="flex space-x-2">
          {!activeCall ? (
            <Button
              onClick={handleTestCall}
              disabled={!isReady || isConnecting}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Phone className="h-4 w-4 mr-2" />
              {isConnecting ? 'Connecting...' : (device ? 'Make Real Call' : 'Test Demo Call')}
            </Button>
          ) : (
            <Button
              onClick={handleEndCall}
              variant="destructive"
              size="sm"
            >
              End Call
            </Button>
          )}
        </div>
        
        <p className="text-xs text-gray-500">
          {device 
            ? 'This will make an actual call via Twilio using your configured phone number' 
            : 'This will simulate a call for testing purposes'
          }
        </p>
      </div>
    </div>
  );
}; 