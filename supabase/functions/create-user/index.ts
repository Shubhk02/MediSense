import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Verify caller is admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No authorization header" }), { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  
  if (!profile || profile.role !== 'admin') {
    return new Response(JSON.stringify({ error: "Forbidden: Admins only" }), { status: 403 });
  }

  // 2. Parse body for new user details
  const { email, password, name, role } = await req.json();

  if (!email || !password || !name || !role) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  if (!['nurse', 'doctor', 'admin'].includes(role)) {
    return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400 });
  }

  // 3. Create user using admin API
  // Note: the triggers we created will automatically insert into the profiles table!
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role
    }
  });

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ ok: true, user: newUser }), {
    headers: { 'Content-Type': 'application/json' },
    status: 201
  });
});
