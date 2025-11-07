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

const Settings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Record<string, string>>({});

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

      <Button onClick={handleSave} disabled={updateSettingsMutation.isPending}>
        {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
};

export default Settings;