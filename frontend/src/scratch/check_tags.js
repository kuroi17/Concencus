
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://bnitxfikghljftepsult.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaXR4ZmlrZ2hsamZ0ZXBzdWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjQ5OTksImV4cCI6MjA5MjEwMDk5OX0.j8SsI-ZxmZYVsg6ZAXMAtd37BJ0OOW9z0sVA-DOXT_g'
)

async function testInsert() {
  console.log('Attempting test insert into proposals...')
  const { data, error } = await supabase
    .from('proposals')
    .insert([
      {
        title: 'Test Proposal',
        description: 'Test Description',
        category: 'General',
        sdg_tags: ['SDG 1'],
        is_anonymous: false,
        author_id: 'd8c4e9e0-6e4b-4f8a-9c7a-8b6a1c2d3e4f', 
        channel_id: '785e0952-474c-4734-b223-9585675f6e8f' 
      }
    ])
    .select()

  if (error) {
    console.error('Insert Error:', error)
  } else {
    console.log('Insert Success:', data)
  }
}

testInsert()
