import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Send } from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [showTwilioSid, setShowTwilioSid] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [testSmsPhone, setTestSmsPhone] = useState("");
  const [testingSms, setTestingSms] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*");
      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      data.forEach((s) => {
        settingsMap[s.key] = s.value;
      });
      setSettings(settingsMap);
      return data;
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Record<string, string>) => {
      const updates = Object.entries(newSettings).map(([key, value]) => ({
        key,
        value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("settings")
          .update({ value: update.value })
          .eq("key", update.key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Success", description: "Settings updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleTestSms = async () => {
    if (!testSmsPhone || testSmsPhone.trim() === "") {
      toast({
        title: "Error",
        description: "Please enter a phone number to test SMS delivery",
        variant: "destructive",
      });
      return;
    }

    if (!/^\+[1-9]\d{1,14}$/.test(testSmsPhone.trim())) {
      toast({
        title: "Error",
        description: "Phone number must be in E.164 format (e.g., +15551234567)",
        variant: "destructive",
      });
      return;
    }

    setTestingSms(true);
    try {
      const { error } = await supabase.functions.invoke("test-sms", {
        body: { phone: testSmsPhone.trim() },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test SMS sent successfully! Check your phone.",
      });
      setTestSmsPhone("");
    } catch (error: any) {
      console.error("Test SMS error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test SMS. Check your Twilio configuration.",
        variant: "destructive",
      });
    } finally {
      setTestingSms(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure system integrations and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>n8n Integration</CardTitle>
          <CardDescription>
            Configure webhook integration with external n8n workflows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="use-n8n-router">Enable n8n Router</Label>
              <p className="text-sm text-muted-foreground">
                Route leads through n8n webhook instead of internal logic
              </p>
            </div>
            <Switch
              id="use-n8n-router"
              checked={settings["USE_N8N_ROUTER"] === "true"}
              onCheckedChange={(checked) =>
                updateSetting("USE_N8N_ROUTER", checked ? "true" : "false")
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="n8n-router-url">n8n Router Webhook URL</Label>
            <Input
              id="n8n-router-url"
              value={settings["N8N_ROUTER_WEBHOOK_URL"] || ""}
              onChange={(e) => updateSetting("N8N_ROUTER_WEBHOOK_URL", e.target.value)}
              placeholder="https://..."
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="use-n8n-refunds">Enable n8n Refunds</Label>
              <p className="text-sm text-muted-foreground">
                Process refunds through n8n webhook
              </p>
            </div>
            <Switch
              id="use-n8n-refunds"
              checked={settings["USE_N8N_REFUNDS"] === "true"}
              onCheckedChange={(checked) =>
                updateSetting("USE_N8N_REFUNDS", checked ? "true" : "false")
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="n8n-refund-url">n8n Refund Webhook URL</Label>
            <Input
              id="n8n-refund-url"
              value={settings["N8N_REFUND_WEBHOOK_URL"] || ""}
              onChange={(e) => updateSetting("N8N_REFUND_WEBHOOK_URL", e.target.value)}
              placeholder="https://..."
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="use-n8n-claims">Enable n8n Claims Handler</Label>
              <p className="text-sm text-muted-foreground">
                Process claim updates through n8n webhook
              </p>
            </div>
            <Switch
              id="use-n8n-claims"
              checked={settings["USE_N8N_CLAIMS"] === "true"}
              onCheckedChange={(checked) =>
                updateSetting("USE_N8N_CLAIMS", checked ? "true" : "false")
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="n8n-claim-url">n8n Claim Webhook URL</Label>
            <Input
              id="n8n-claim-url"
              value={settings["N8N_CLAIM_WEBHOOK_URL"] || ""}
              onChange={(e) => updateSetting("N8N_CLAIM_WEBHOOK_URL", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Refund Configuration</CardTitle>
          <CardDescription>Configure refund request policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="refund-window-days">Refund Window (Days)</Label>
            <Input
              id="refund-window-days"
              type="number"
              min="1"
              max="365"
              value={settings["REFUND_WINDOW_DAYS"] || "14"}
              onChange={(e) => updateSetting("REFUND_WINDOW_DAYS", e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Refund requests must be submitted within this many days of delivery creation
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stripe Billing</CardTitle>
          <CardDescription>Configure payment processing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enable-stripe">Enable Stripe Billing</Label>
              <p className="text-sm text-muted-foreground">
                Charge buyers for leads via Stripe
              </p>
            </div>
            <Switch
              id="enable-stripe"
              checked={settings["ENABLE_STRIPE_BILLING"] === "true"}
              onCheckedChange={(checked) =>
                updateSetting("ENABLE_STRIPE_BILLING", checked ? "true" : "false")
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Twilio SMS Configuration</CardTitle>
          <CardDescription>Configure SMS notifications for lead deliveries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enable-sms">Enable SMS Delivery</Label>
              <p className="text-sm text-muted-foreground">
                Send SMS notifications to buyers when leads are delivered
              </p>
            </div>
            <Switch
              id="enable-sms"
              checked={settings["ENABLE_SMS_DELIVERY"] === "true"}
              onCheckedChange={(checked) =>
                updateSetting("ENABLE_SMS_DELIVERY", checked ? "true" : "false")
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="twilio-sid">Twilio Account SID</Label>
            <div className="relative">
              <Input
                id="twilio-sid"
                type={showTwilioSid ? "text" : "password"}
                value={settings["TWILIO_ACCOUNT_SID"] || ""}
                onChange={(e) => updateSetting("TWILIO_ACCOUNT_SID", e.target.value)}
                placeholder="AC..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowTwilioSid(!showTwilioSid)}
              >
                {showTwilioSid ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Found in your Twilio console dashboard
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="twilio-token">Twilio Auth Token</Label>
            <div className="relative">
              <Input
                id="twilio-token"
                type={showTwilioToken ? "text" : "password"}
                value={settings["TWILIO_AUTH_TOKEN"] || ""}
                onChange={(e) => updateSetting("TWILIO_AUTH_TOKEN", e.target.value)}
                placeholder="Enter auth token"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowTwilioToken(!showTwilioToken)}
              >
                {showTwilioToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Found in your Twilio console dashboard (keep this secret!)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="twilio-from">Twilio Phone Number</Label>
            <Input
              id="twilio-from"
              type="text"
              value={settings["TWILIO_FROM_NUMBER"] || ""}
              onChange={(e) => updateSetting("TWILIO_FROM_NUMBER", e.target.value)}
              placeholder="+15551234567"
            />
            <p className="text-xs text-muted-foreground">
              Your Twilio phone number in E.164 format (e.g., +15551234567)
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="test-sms-phone">Test SMS Delivery</Label>
            <div className="flex gap-2">
              <Input
                id="test-sms-phone"
                type="text"
                value={testSmsPhone}
                onChange={(e) => setTestSmsPhone(e.target.value)}
                placeholder="+15551234567"
                disabled={testingSms}
              />
              <Button
                onClick={handleTestSms}
                disabled={testingSms || !settings["TWILIO_ACCOUNT_SID"] || !settings["TWILIO_AUTH_TOKEN"] || !settings["TWILIO_FROM_NUMBER"]}
              >
                <Send className="h-4 w-4 mr-2" />
                {testingSms ? "Sending..." : "Send Test"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>Important:</strong> Save your Twilio credentials above before testing SMS delivery
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateSettingsMutation.isPending}>
        {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
};

export default Settings;