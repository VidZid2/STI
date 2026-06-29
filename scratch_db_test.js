import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log('Querying Supabase students table for Josiah...');
    const { data: students, error: errStudents } = await supabase
        .from('students')
        .select('*')
        .ilike('full_name', '%De Asis%');
        
    if (errStudents) console.error('Error students:', errStudents);
    else {
        console.log('Students found in DB:', students.length);
        console.log(JSON.stringify(students, null, 2));
    }
}

test();
