import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkTags() {
  const { data, error } = await supabase.from('proposals').select('sdg_tags');
  if (error) {
    console.error(error);
    return;
  }
  console.log('Total proposals:', data.length);
  const tagCounts = {};
  data.forEach(p => {
    if (p.sdg_tags) {
      p.sdg_tags.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    }
  });
  console.log('Tag counts:', tagCounts);
}

checkTags();
