import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const leadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone must be at least 10 characters").max(20),
  city: z.string().min(2, "City must be at least 2 characters").max(50),
  service_type: z.string().min(3, "Service type must be at least 3 characters").max(50),
  campaign_id: z.string().optional(),
  budget_raw: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  exclusivity: z.enum(["shared", "exclusive"]),
  price_per_buyer: z.coerce.number().min(0, "Price must be 0 or greater"),
  source: z.enum(["website-form", "test-form", "manual"]),
});

type LeadFormData = z.infer<typeof leadSchema>;

export function AddLeadDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch campaigns for dropdown
  const { data: campaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      city: "",
      service_type: "",
      campaign_id: "",
      budget_raw: "",
      notes: "",
      exclusivity: "shared",
      price_per_buyer: 0,
      source: "manual",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      // Generate hash for duplicate detection
      const hash = `${data.email}${data.phone}`.toLowerCase();
      
      const { error } = await supabase.from("leads").insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        city: data.city.toLowerCase(),
        service_type: data.service_type,
        campaign_id: data.campaign_id || null,
        budget_raw: data.budget_raw || null,
        notes: data.notes || null,
        exclusivity: data.exclusivity,
        price_per_buyer: data.price_per_buyer,
        source: data.source,
        status: "new",
        hash_24h: hash,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead added successfully!");
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error("Failed to add lead: " + error.message);
    },
  });

  const onSubmit = (data: LeadFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>Create a new lead manually</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Contact Information</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Doe" />
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
                        <Input {...field} type="email" placeholder="john@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="305-123-4567" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Lead Details</h3>
                
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

                <FormField
                  control={form.control}
                  name="service_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="hvac contractor" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="campaign_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a campaign" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {campaigns?.map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id}>
                              {campaign.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget_raw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="5000-10000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Additional information..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Pricing & Source</h3>
                
                <FormField
                  control={form.control}
                  name="exclusivity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exclusivity</FormLabel>
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
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price_per_buyer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Buyer ($)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" step="0.01" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="website-form">Website Form</SelectItem>
                          <SelectItem value="test-form">Test Form</SelectItem>
                        </SelectContent>
                      </Select>
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
                  {mutation.isPending ? "Adding..." : "Add Lead"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
