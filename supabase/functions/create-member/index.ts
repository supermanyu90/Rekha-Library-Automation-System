import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { form_id, review_notes } = await req.json();

    if (!form_id) {
      return new Response(
        JSON.stringify({ error: 'Missing form_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (staffError || !staffData || !['superadmin', 'admin', 'librarian'].includes(staffData.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: formData, error: formError } = await supabase
      .from('onboarding_forms')
      .select('*')
      .eq('id', form_id)
      .maybeSingle();

    if (formError || !formData) {
      return new Response(
        JSON.stringify({ error: 'Form not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (formData.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Form has already been reviewed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const temporaryPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + '!@#';

    const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
      email: formData.email,
      password: temporaryPassword,
      email_confirm: true,
    });

    if (authCreateError || !authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create auth user: ' + authCreateError?.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .insert({
        name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        membership_type: formData.membership_type,
        user_id: authData.user.id,
      })
      .select()
      .single();

    if (memberError || !memberData) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create member: ' + memberError?.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { error: updateError } = await supabase
      .from('onboarding_forms')
      .update({
        status: 'approved',
        reviewed_by: staffData.id,
        reviewed_at: new Date().toISOString(),
        review_notes: review_notes || null,
        member_id: memberData.id,
      })
      .eq('id', form_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update form: ' + updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Member account created successfully',
        member_id: memberData.id,
        email: formData.email,
        temporary_password: temporaryPassword,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});