import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Phone, PhoneCall, Wifi, WifiOff, Mic, MicOff } from "lucide-react";
import { useTwilioStore } from "@/hooks/useTwilioStore";
import { useToast } from "@/hooks/use-toast";

export const QuickDialer = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const { 
    makeCall, 
    isReady, 
    isConnecting, 
    error, 
    audioUnlocked, 
    unlockAudio,
    initializeDevice 
  } = useTwilioStore();
  const { toast } = useToast();

  const handleDial = async () => {
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
    if (!cleanedPhoneNumber.trim()) {
      toast({
        title: "No Number Entered",
        description: "Please enter a phone number to dial",
        variant: "destructive",
      });
      return;
    }

    if (!isReady) {
      toast({
        title: "System Not Ready",
        description: "Calling system is not ready. Please wait for it to initialize.",
        variant: "destructive",
      });
      return;
    }

    console.log('Quick dialing:', cleanedPhoneNumber);
    await makeCall({ phoneNumber: cleanedPhoneNumber });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDial();
    }
  };

  const formatPhoneInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleUnlockAudio = async () => {
    try {
      await unlockAudio();
      // After unlocking audio, try to initialize the device
      await initializeDevice();
    } catch (error) {
      console.error('Failed to unlock audio:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Quick Dialer</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={audioUnlocked ? "default" : "destructive"} className="text-xs">
              {audioUnlocked ? (
                <>
                  <Mic className="h-3 w-3 mr-1" />
                  Mic Ready
                </>
              ) : (
                <>
                  <MicOff className="h-3 w-3 mr-1" />
                  Mic Off
                </>
              )}
            </Badge>
            <Badge variant={isReady ? "default" : "secondary"} className="text-xs">
              {isReady ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  {error?.includes('Demo Mode') ? 'Demo Mode' : 'Twilio Ready'}
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Initializing...
                </>
              )}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="tel"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={handlePhoneChange}
            onKeyPress={handleKeyPress}
            className="text-lg"
            disabled={isConnecting}
          />
        </div>
        
        {!audioUnlocked && (
          <Button
            onClick={handleUnlockAudio}
            className="w-full bg-orange-600 hover:bg-orange-700 mb-2"
            size="lg"
          >
            <Mic className="h-5 w-5 mr-2" />
            Enable Microphone Access
          </Button>
        )}

        <Button
          onClick={handleDial}
          disabled={isConnecting || !phoneNumber.trim() || !isReady}
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          <PhoneCall className="h-5 w-5 mr-2" />
          {isConnecting ? "Dialing..." : "Dial Now"}
        </Button>

        {!audioUnlocked && (
          <p className="text-xs text-orange-600 text-center">
            🎤 Microphone access required for calling. Click "Enable Microphone Access" above.
          </p>
        )}

        {!isReady && audioUnlocked && (
          <p className="text-xs text-gray-500 text-center">
            Twilio device is initializing. Please wait...
          </p>
        )}

        {error && error.includes('Microphone') && (
          <p className="text-xs text-red-600 text-center">
            ⚠️ {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
};