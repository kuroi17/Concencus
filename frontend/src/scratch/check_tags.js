import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTags() {
  const { data, error } = await supabase.from('proposals').select('sdg_tags');
  if (error) {
    console.error(error);
    return;
  }
  console.log("All Tags:", JSON.stringify(data, null, 2));
}

checkTags();
