import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request body
    const { phone } = await req.json();

    if (!phone || typeof phone !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate E.164 format
    if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: 'Phone number must be in E.164 format (e.g., +15551234567)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch Twilio settings
    const { data: settings } = await supabase.from('settings').select('*');
    const settingsMap = Object.fromEntries(settings?.map(s => [s.key, s.value]) || []);

    const twilioSid = settingsMap['TWILIO_ACCOUNT_SID'];
    const twilioToken = settingsMap['TWILIO_AUTH_TOKEN'];
    const twilioFrom = settingsMap['TWILIO_FROM_NUMBER'];

    if (!twilioSid || !twilioToken || !twilioFrom) {
      console.error('[Test SMS] Missing Twilio credentials');
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER in Settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send test SMS
    const smsBody = 'Test SMS from your lead management system. Twilio configuration is working correctly!';
    
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    const authHeader = 'Basic ' + btoa(`${twilioSid}:${twilioToken}`);
    
    const formBody = new URLSearchParams({
      To: phone,
      From: twilioFrom,
      Body: smsBody,
    });

    console.log('[Test SMS] Sending test message to:', phone);

    const smsResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    });

    if (!smsResponse.ok) {
      const errorText = await smsResponse.text();
      console.error('[Test SMS] Twilio error:', smsResponse.status, errorText);
      
      let errorMessage = 'Failed to send SMS';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      return new Response(
        JSON.stringify({ error: `Twilio error: ${errorMessage}` }),
        { status: smsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseData = await smsResponse.json();
    console.log('[Test SMS] Successfully sent test SMS, SID:', responseData.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test SMS sent successfully',
        sid: responseData.sid 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Test SMS] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
