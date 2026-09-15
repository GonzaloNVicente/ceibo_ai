import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@ceibo.ai',
    password: 'password123'
  });
  
  if (authError) {
    console.error('AUTH ERROR:', authError.message);
    return;
  }
  
  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', authData.user.id).single();
  
  if (!perfil) {
    console.error('NO PERFIL');
    return;
  }

  const { data, error } = await supabase
        .from('chat_analytics_daily')
        .select('*')
        .eq('empresa_id', perfil.empresa_id)
        .order('date', { ascending: false })
        .limit(30);

  if (error) {
    console.error('FETCH ERROR:', error.message);
  } else {
    console.log('FETCH SUCCESS:', data?.length, 'rows');
  }
}

run();
