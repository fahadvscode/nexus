
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Phone, Key, Globe, TestTube, CheckCircle, XCircle, Eye, EyeOff, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const TwilioSettings = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [agentPhoneNumber, setAgentPhoneNumber] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showSid, setShowSid] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const settingsString = localStorage.getItem('twilio-settings');
    const settings = settingsString ? JSON.parse(settingsString) : {};
    
    setIsEnabled(settings.enabled ?? false);
    setAccountSid(settings.accountSid ?? "");
    setAuthToken(settings.authToken ?? "");
    setWebhookUrl(settings.webhookUrl ?? "");
    setAgentPhoneNumber(settings.agentPhoneNumber ?? "(251) 312-3121");
    if (settings.accountSid && settings.authToken) {
      setIsConnected(true);
    }
  }, []);

  const handleSaveSettings = () => {
    // Store settings in localStorage for demo purposes
    const settings = {
      enabled: isEnabled,
      accountSid,
      authToken,
      webhookUrl,
      agentPhoneNumber,
      lastUpdated: new Date().toISOString(),
    };
    
    localStorage.setItem('twilio-settings', JSON.stringify(settings));
    
    toast({
      title: "Settings Saved",
      description: "Twilio configuration has been updated successfully.",
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    
    // Simulate API test
    setTimeout(() => {
      if (accountSid && authToken) {
        setIsConnected(true);
        toast({
          title: "Connection Successful",
          description: "Twilio account verified successfully.",
        });
      } else {
        setIsConnected(false);
        toast({
          title: "Connection Failed",
          description: "Please check your Account SID and Auth Token.",
          variant: "destructive",
        });
      }
      setIsTesting(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Twilio Integration</span>
              </CardTitle>
              <CardDescription>
                Configure Twilio for voice calls and SMS messaging
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Disconnected
                  </>
                )}
              </Badge>
              <Switch
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account-sid">Account SID</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="account-sid"
                  type={showSid ? "text" : "password"}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={accountSid}
                  onChange={(e) => setAccountSid(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={!isEnabled}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowSid(!showSid)}
                  disabled={!isEnabled}
                >
                  {showSid ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-token">Auth Token</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="auth-token"
                  type={showToken ? "text" : "password"}
                  placeholder="Your Auth Token"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={!isEnabled}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowToken(!showToken)}
                  disabled={!isEnabled}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-domain.com/twilio/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="pl-10"
                disabled={!isEnabled}
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={handleTestConnection}
              variant="outline"
              disabled={!isEnabled || isTesting || !accountSid || !authToken}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTesting ? "Testing..." : "Test Connection"}
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={!isEnabled}
            >
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Agent Configuration</span>
          </CardTitle>
          <CardDescription>
            Set the phone number for your agent account. This number will be used to connect you with leads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="agent-phone-number">Your Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="agent-phone-number"
                type="tel"
                placeholder="+15551234567"
                value={agentPhoneNumber}
                onChange={(e) => setAgentPhoneNumber(e.target.value)}
                className="pl-10"
                disabled={!isEnabled}
              />
            </div>
            <p className="text-sm text-gray-500">
              Enter your full phone number including country code (e.g., +1 for USA). This number will be used for making and receiving calls.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Twilio Features</CardTitle>
          <CardDescription>
            Enable specific Twilio features for your CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Voice Calls</Label>
              <p className="text-sm text-gray-500">Enable outbound voice calls to clients</p>
            </div>
            <Switch defaultChecked disabled={!isEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">SMS Messaging</Label>
              <p className="text-sm text-gray-500">Send SMS messages to clients</p>
            </div>
            <Switch disabled={!isEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Call Recording</Label>
              <p className="text-sm text-gray-500">Record calls for quality assurance</p>
            </div>
            <Switch disabled={!isEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Call Analytics</Label>
              <p className="text-sm text-gray-500">Track call duration and outcomes</p>
            </div>
            <Switch defaultChecked disabled={!isEnabled} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
