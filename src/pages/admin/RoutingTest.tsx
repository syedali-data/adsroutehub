import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Play, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RoutingCandidate {
  buyer_id: string;
  business_name: string;
  city: string;
  email: string;
  daily_sent: number;
  daily_cap: number;
  free_leads_left: number;
  response_rate: number;
  would_receive: boolean;
  reason: string;
  using_free_lead: boolean;
  calculated_charge_amount: number;
}

interface RoutingTestResult {
  candidates: RoutingCandidate[];
  selected_count: number;
}

const RoutingTest = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RoutingTestResult | null>(null);
  
  // Form state
  const [name, setName] = useState("Test Lead");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [exclusivity, setExclusivity] = useState<"shared" | "exclusive">("shared");

  const handleTest = async () => {
    if (!email || !phone || !city || !serviceType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-lead-routing', {
        body: {
          name,
          email,
          phone,
          city,
          service_type: serviceType,
          exclusivity,
        },
      });

      if (error) throw error;

      setResult(data as RoutingTestResult);
      toast({
        title: "Test Complete",
        description: `Routing simulation completed. ${data.selected_count} buyer(s) would receive this lead.`,
      });
    } catch (error: any) {
      console.error('Routing test error:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Failed to run routing test",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Routing Test</h1>
          <p className="text-muted-foreground">
            Simulate lead routing without creating real leads or deliveries
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This is a dry-run test. No leads, deliveries, or buyer records will be modified.
            Use this to verify routing logic before sending real leads.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Test Lead Details</CardTitle>
              <CardDescription>Enter lead information to test routing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (E.164 format) *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+14165551234"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="toronto"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type *</Label>
                <Input
                  id="service_type"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="plumbing"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Exclusivity *</Label>
                <RadioGroup value={exclusivity} onValueChange={(v) => setExclusivity(v as "shared" | "exclusive")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="shared" id="shared" />
                    <Label htmlFor="shared" className="font-normal">Shared (multiple buyers)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="exclusive" id="exclusive" />
                    <Label htmlFor="exclusive" className="font-normal">Exclusive (single buyer)</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                onClick={handleTest}
                disabled={isLoading}
                className="w-full"
              >
                <Play className="mr-2 h-4 w-4" />
                {isLoading ? "Running Test..." : "Run Routing Test"}
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Test Summary</CardTitle>
                <CardDescription>
                  {result.selected_count} of {result.candidates.length} buyer(s) would receive this lead
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Candidates:</span>
                    <span className="font-medium">{result.candidates.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Would Receive:</span>
                    <span className="font-medium text-green-600">{result.selected_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Filtered Out:</span>
                    <span className="font-medium text-orange-600">
                      {result.candidates.length - result.selected_count}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {result && result.candidates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Routing Results</CardTitle>
              <CardDescription>
                Detailed breakdown of all candidate buyers and routing decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Daily Sent/Cap</TableHead>
                      <TableHead className="text-right">Free Leads</TableHead>
                      <TableHead className="text-right">Response Rate</TableHead>
                      <TableHead className="text-right">Charge</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.candidates.map((candidate) => (
                      <TableRow key={candidate.buyer_id}>
                        <TableCell className="font-medium">{candidate.business_name}</TableCell>
                        <TableCell>{candidate.city}</TableCell>
                        <TableCell>
                          {candidate.would_receive ? (
                            <Badge variant="default" className="bg-green-600">Would Receive</Badge>
                          ) : (
                            <Badge variant="secondary">Filtered Out</Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs text-sm text-muted-foreground">
                          {candidate.reason}
                        </TableCell>
                        <TableCell className="text-right">
                          {candidate.daily_sent}/{candidate.daily_cap}
                        </TableCell>
                        <TableCell className="text-right">
                          {candidate.free_leads_left}
                        </TableCell>
                        <TableCell className="text-right">
                          {(candidate.response_rate * 100).toFixed(0)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {candidate.would_receive ? (
                            <>
                              ${candidate.calculated_charge_amount.toFixed(2)}
                              {candidate.using_free_lead && (
                                <Badge variant="outline" className="ml-2 text-xs">Free</Badge>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {result && result.candidates.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No buyers found matching the criteria. Check that active buyers exist for the specified city and service type.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RoutingTest;
