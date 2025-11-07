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
import { Plus } from "lucide-react";

const campaignSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  slug: z.string().min(3, "Slug must be at least 3 characters").max(50),
  service_type: z.string().min(3, "Service type must be at least 3 characters").max(50),
  city: z.string().min(2, "City must be at least 2 characters").max(50),
  status: z.enum(["active", "paused"]),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export function AddCampaignDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      slug: "",
      service_type: "",
      city: "",
      status: "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const { error } = await supabase.from("campaigns").insert({
        name: data.name,
        slug: data.slug.toLowerCase(),
        service_type: data.service_type,
        city: data.city.toLowerCase(),
        status: data.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign added successfully!");
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error("Failed to add campaign: " + error.message);
    },
  });

  const onSubmit = (data: CampaignFormData) => {
    mutation.mutate(data);
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    const slug = value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    form.setValue("slug", slug);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Campaign</DialogTitle>
          <DialogDescription>Create a new marketing campaign</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleNameChange(e.target.value);
                      }}
                      placeholder="Summer HVAC Campaign"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="summer-hvac-campaign" />
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
                        <RadioGroupItem value="active" id="active" />
                        <label htmlFor="active" className="cursor-pointer">Active</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="paused" id="paused" />
                        <label htmlFor="paused" className="cursor-pointer">Paused</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Adding..." : "Add Campaign"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
