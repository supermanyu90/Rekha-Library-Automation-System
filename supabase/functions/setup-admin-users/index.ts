import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AdminUser {
  email: string;
  password: string;
  name: string;
  role: string;
}

const PERMANENT_ADMIN_USERS: AdminUser[] = [
  {
    email: 'superadmin@rekha.library',
    password: 'SuperAdmin@2025',
    name: 'Rekha Superadmin',
    role: 'superadmin'
  },
  {
    email: 'admin@rekha.library',
    password: 'Admin@2025',
    name: 'Rekha Admin',
    role: 'admin'
  },
  {
    email: 'librarian@rekha.library',
    password: 'Librarian@2025',
    name: 'Rekha Librarian',
    role: 'librarian'
  }
];

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
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results = [];

    for (const adminUser of PERMANENT_ADMIN_USERS) {
      try {
        // Check if staff record exists
        const { data: staffRecord, error: staffError } = await supabaseAdmin
          .from('staff')
          .select('id, user_id, email, name, role')
          .eq('email', adminUser.email)
          .maybeSingle();

        if (staffError) {
          results.push({
            email: adminUser.email,
            success: false,
            error: `Staff lookup error: ${staffError.message}`
          });
          continue;
        }

        if (!staffRecord) {
          results.push({
            email: adminUser.email,
            success: false,
            error: 'Staff record not found in database'
          });
          continue;
        }

        // Check if auth user already exists
        if (staffRecord.user_id) {
          results.push({
            email: adminUser.email,
            success: true,
            status: 'already_exists',
            userId: staffRecord.user_id,
            message: 'Auth user already linked to staff record'
          });
          continue;
        }

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: adminUser.email,
          password: adminUser.password,
          email_confirm: true,
          user_metadata: {
            name: adminUser.name,
            role: adminUser.role
          }
        });

        if (authError) {
          // Check if user already exists
          if (authError.message.includes('already registered')) {
            // Try to get the existing user
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = existingUsers?.users.find(u => u.email === adminUser.email);
            
            if (existingUser) {
              // Link existing auth user to staff record
              const { error: updateError } = await supabaseAdmin
                .from('staff')
                .update({ user_id: existingUser.id })
                .eq('id', staffRecord.id);

              if (updateError) {
                results.push({
                  email: adminUser.email,
                  success: false,
                  error: `Failed to link existing user: ${updateError.message}`
                });
              } else {
                results.push({
                  email: adminUser.email,
                  success: true,
                  status: 'linked_existing',
                  userId: existingUser.id,
                  message: 'Linked existing auth user to staff record'
                });
              }
            } else {
              results.push({
                email: adminUser.email,
                success: false,
                error: 'User exists but could not be found'
              });
            }
          } else {
            results.push({
              email: adminUser.email,
              success: false,
              error: `Auth creation error: ${authError.message}`
            });
          }
          continue;
        }

        // Link auth user to staff record
        const { error: updateError } = await supabaseAdmin
          .from('staff')
          .update({ user_id: authData.user.id })
          .eq('id', staffRecord.id);

        if (updateError) {
          results.push({
            email: adminUser.email,
            success: false,
            error: `Failed to link user: ${updateError.message}`,
            userId: authData.user.id
          });
          continue;
        }

        results.push({
          email: adminUser.email,
          success: true,
          status: 'created',
          userId: authData.user.id,
          message: 'Auth user created and linked successfully'
        });

      } catch (error) {
        results.push({
          email: adminUser.email,
          success: false,
          error: error.message
        });
      }
    }

    const allSuccessful = results.every(r => r.success);

    return new Response(
      JSON.stringify({
        success: allSuccessful,
        message: allSuccessful 
          ? 'All admin users setup successfully' 
          : 'Some admin users failed to setup',
        results
      }),
      {
        status: allSuccessful ? 200 : 207,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});