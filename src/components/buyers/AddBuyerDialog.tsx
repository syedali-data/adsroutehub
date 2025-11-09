import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const buyerSchema = z.object({
  business_name: z.string().min(3, "Business name must be at least 3 characters").max(100),
  external_code: z.string().max(20).optional(),
  email: z.string().email("Invalid email address"),
  city: z.string().min(2, "City must be at least 2 characters").max(50),
  services_csv: z.string().min(3, "Services are required"),
  pricing_mode: z.enum(["shared", "exclusive", "both"]),
  price_shared: z.coerce.number().min(0, "Price must be 0 or greater"),
  price_exclusive: z.coerce.number().min(0, "Price must be 0 or greater"),
  daily_cap: z.coerce.number().min(1, "Daily cap must be at least 1"),
  shared_cap: z.coerce.number().min(1, "Shared cap must be at least 1"),
  free_leads_left: z.coerce.number().min(0, "Must be 0 or greater"),
  response_rate: z.coerce.number().min(0).max(1, "Response rate must be between 0 and 1"),
  status: z.enum(["active", "paused", "test"]),
});

type BuyerFormData = z.infer<typeof buyerSchema>;

export function AddBuyerDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<BuyerFormData>({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      business_name: "",
      external_code: "",
      email: "",
      city: "",
      services_csv: "",
      pricing_mode: "both",
      price_shared: 0,
      price_exclusive: 0,
      daily_cap: 10,
      shared_cap: 3,
      free_leads_left: 0,
      response_rate: 1.0,
      status: "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: BuyerFormData) => {
      console.log("[AddBuyerDialog] Inserting buyer:", data);
      const { error } = await supabase.from("buyers").insert({
        business_name: data.business_name,
        external_code: data.external_code || null,
        email: data.email,
        city: data.city.toLowerCase(),
        services_csv: data.services_csv,
        pricing_mode: data.pricing_mode,
        price_shared: data.price_shared,
        price_exclusive: data.price_exclusive,
        daily_cap: data.daily_cap,
        shared_cap: data.shared_cap,
        free_leads_left: data.free_leads_left,
        response_rate: data.response_rate,
        status: data.status,
        daily_sent: 0,
      });
      if (error) {
        console.error("[AddBuyerDialog] Error inserting buyer:", error);
        throw error;
      }
      console.log("[AddBuyerDialog] Buyer inserted successfully");
    },
    onSuccess: () => {
      console.log("[AddBuyerDialog] Mutation success, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["buyers"] });
      toast.success("Buyer added successfully!");
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error("[AddBuyerDialog] Mutation error:", error);
      toast.error("Failed to add buyer: " + error.message);
    },
  });

  const onSubmit = (data: BuyerFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Buyer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Buyer</DialogTitle>
          <DialogDescription>Create a new lead buyer</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="business_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ABC Services LLC" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="external_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External Code (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="B-001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="contact@business.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="miami" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Services & Pricing</h3>
                
                <FormField
                  control={form.control}
                  name="services_csv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Services (comma-separated)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="hvac contractor,plumbing,electrical" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pricing_mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pricing Mode</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="shared" id="shared" />
                            <label htmlFor="shared" className="cursor-pointer">Shared</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="exclusive" id="exclusive" />
                            <label htmlFor="exclusive" className="cursor-pointer">Exclusive</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="both" id="both" />
                            <label htmlFor="both" className="cursor-pointer">Both</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price_shared"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Shared ($)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price_exclusive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Exclusive ($)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Caps & Limits</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="daily_cap"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Cap</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shared_cap"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shared Cap</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="free_leads_left"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Free Leads Left</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="response_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Response Rate (0-1)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" max="1" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Status</h3>
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="active" id="status-active" />
                            <label htmlFor="status-active" className="cursor-pointer">Active</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="paused" id="status-paused" />
                            <label htmlFor="status-paused" className="cursor-pointer">Paused</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="test" id="status-test" />
                            <label htmlFor="status-test" className="cursor-pointer">Test</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Adding..." : "Add Buyer"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
