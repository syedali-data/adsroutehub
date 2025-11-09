import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { routeLeadInternal } from "../_shared/router.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema for test lead
const TestLeadSchema = z.object({
  name: z.string().optional().default('Test Lead'),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  city: z.string().min(2),
  service_type: z.string().min(2),
  exclusivity: z.enum(['shared', 'exclusive']).default('shared'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with user's auth token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    // Verify user is authenticated and has admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate test lead data
    const rawPayload = await req.json();
    let payload;
    try {
      payload = TestLeadSchema.parse(rawPayload);
    } catch (validationError) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationError instanceof z.ZodError ? validationError.errors : 'Validation failed'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a service role client for the routing logic (needs full access)
    const supabaseServiceClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Run routing in dry-run mode (no mutations)
    const routingResult = await routeLeadInternal(
      supabaseServiceClient,
      {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        city: payload.city.toLowerCase(),
        service_type: payload.service_type.toLowerCase(),
        exclusivity: payload.exclusivity,
      },
      true // dry run = true
    );

    // Format response for UI
    const response = {
      candidates: routingResult.candidates.map(c => ({
        buyer_id: c.buyer.id,
        business_name: c.buyer.business_name,
        city: c.buyer.city,
        email: c.buyer.email,
        daily_sent: c.buyer.daily_sent,
        daily_cap: c.buyer.daily_cap,
        free_leads_left: c.buyer.free_leads_left,
        response_rate: c.buyer.response_rate,
        would_receive: c.would_receive,
        reason: c.reason,
        using_free_lead: c.using_free_lead,
        calculated_charge_amount: c.calculated_charge_amount,
      })),
      selected_count: routingResult.selected.length,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Test Lead Routing] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
