import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './apps/negocio_admin/.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testQuery() {
  console.log('Testing Oportunidades query...')
  const { data, error } = await supabase
    .from('oportunidades')
    .select('*, cliente:clientes(*)')
    .limit(1)
  
  if (error) {
    console.error('Error in query:', error)
  } else {
    console.log('Query success:', data)
  }
}

testQuery()
