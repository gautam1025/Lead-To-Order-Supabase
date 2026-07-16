const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function count() {
    const { count, error } = await supabase
        .from('enquiry_to_order')
        .select('*', { count: 'exact', head: true });
    
    if (error) console.error(error);
    else console.log('Total records:', count);
}
count();
