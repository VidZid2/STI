import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const getXPNeededForLevel = (level: number) => {
	return 100 + (level - 1) * 25;
};

const calculateLevel = (totalXP: number) => {
    let remainingXP = totalXP;
    let currentLevel = 1;
    while (currentLevel < 20) {
        const xpNeeded = getXPNeededForLevel(currentLevel);
        if (remainingXP < xpNeeded) {
            break;
        }
        remainingXP -= xpNeeded;
        currentLevel++;
    }
    if (currentLevel >= 20) {
        return { level: 20, xpInLevel: 0 };
    }
    return { level: currentLevel, xpInLevel: remainingXP };
};

async function test() {
    const { data: stats, error } = await supabase
        .from('student_stats')
        .select('*')
        .eq('student_id', '02000543210')
        .single();
        
    console.log('02000543210 stats before update:', JSON.stringify(stats.xp_data, null, 2));

    const newTotalXP = 42205;
    const { level, xpInLevel } = calculateLevel(newTotalXP);
    
    const newXpData = {
        ...stats.xp_data,
        totalXP: newTotalXP,
        currentLevel: level,
        xpInCurrentLevel: xpInLevel
    };

    const { error: updateError } = await supabase
        .from('student_stats')
        .update({ xp_data: newXpData })
        .eq('student_id', '02000543210');
        
    console.log('updateError:', updateError);
    console.log('Updated to:', JSON.stringify(newXpData, null, 2));
}

test();
