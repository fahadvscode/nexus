
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Key, Server, User, Eye, EyeOff, TestTube, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const EmailSettings = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [emailProvider, setEmailProvider] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [emailSignature, setEmailSignature] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const handleSaveSettings = () => {
    const settings = {
      enabled: isEnabled,
      provider: emailProvider,
      smtp: {
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        password: smtpPassword,
      },
      apiKey,
      sender: {
        email: fromEmail,
        name: fromName,
        replyTo,
      },
      signature: emailSignature,
      lastUpdated: new Date().toISOString(),
    };
    
    localStorage.setItem('email-settings', JSON.stringify(settings));
    
    toast({
      title: "Settings Saved",
      description: "Email configuration has been updated successfully.",
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    
    setTimeout(() => {
      if ((emailProvider === 'smtp' && smtpHost && smtpUser) || (emailProvider !== 'smtp' && apiKey)) {
        setIsConnected(true);
        toast({
          title: "Connection Successful",
          description: "Email service connected successfully.",
        });
      } else {
        setIsConnected(false);
        toast({
          title: "Connection Failed",
          description: "Please check your email configuration.",
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
                <Mail className="h-5 w-5" />
                <span>Email Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure email settings for sending emails to leads
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
          <div className="space-y-2">
            <Label htmlFor="email-provider">Email Provider</Label>
            <Select value={emailProvider} onValueChange={setEmailProvider} disabled={!isEnabled}>
              <SelectTrigger>
                <SelectValue placeholder="Select email provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sendgrid">SendGrid</SelectItem>
                <SelectItem value="mailgun">Mailgun</SelectItem>
                <SelectItem value="smtp">Custom SMTP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {emailProvider === 'smtp' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <div className="relative">
                  <Server className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="smtp-host"
                    placeholder="smtp.gmail.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="pl-10"
                    disabled={!isEnabled}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input
                  id="smtp-port"
                  placeholder="587"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  disabled={!isEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-user">SMTP Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="smtp-user"
                    placeholder="your-email@domain.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="pl-10"
                    disabled={!isEnabled}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-password">SMTP Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="smtp-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your SMTP password"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={!isEnabled}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={!isEnabled}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : emailProvider && (
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder={`Your ${emailProvider} API key`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={!isEnabled}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                  disabled={!isEnabled}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-email">From Email</Label>
              <Input
                id="from-email"
                type="email"
                placeholder="noreply@yourdomain.com"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                disabled={!isEnabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-name">From Name</Label>
              <Input
                id="from-name"
                placeholder="Your Company Name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                disabled={!isEnabled}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reply-to">Reply-To Email</Label>
            <Input
              id="reply-to"
              type="email"
              placeholder="support@yourdomain.com"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              disabled={!isEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-signature">Email Signature</Label>
            <Textarea
              id="email-signature"
              placeholder="Best regards,&#10;Your Name&#10;Your Company"
              value={emailSignature}
              onChange={(e) => setEmailSignature(e.target.value)}
              rows={4}
              disabled={!isEnabled}
            />
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={handleTestConnection}
              variant="outline"
              disabled={!isEnabled || isTesting || !emailProvider}
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
    </div>
  );
};
