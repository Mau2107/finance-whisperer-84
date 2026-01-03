import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date().toISOString().split('T')[0];

    console.log(`Processing recurring transactions for date: ${today}`);

    // Get all active recurring transactions due today or earlier
    const { data: recurringTxns, error: fetchError } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_date', today);

    if (fetchError) {
      console.error('Error fetching recurring transactions:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${recurringTxns?.length || 0} recurring transactions to process`);

    const processed: string[] = [];
    const errors: { id: string; error: string }[] = [];

    for (const recurring of recurringTxns || []) {
      try {
        // Create the actual transaction
        const { error: insertError } = await supabase
          .from('transactions')
          .insert({
            user_id: recurring.user_id,
            type: recurring.type,
            amount: recurring.amount,
            category: recurring.category,
            description: recurring.description,
            payment_method: recurring.payment_method,
            date: recurring.next_run_date,
            is_recurring: true,
          });

        if (insertError) {
          console.error(`Error creating transaction for recurring ${recurring.id}:`, insertError);
          errors.push({ id: recurring.id, error: insertError.message });
          continue;
        }

        // Calculate next run date
        const nextDate = calculateNextRunDate(new Date(recurring.next_run_date), recurring.frequency);
        
        // Update the recurring transaction with new next_run_date
        const { error: updateError } = await supabase
          .from('recurring_transactions')
          .update({ next_run_date: nextDate.toISOString().split('T')[0] })
          .eq('id', recurring.id);

        if (updateError) {
          console.error(`Error updating next_run_date for ${recurring.id}:`, updateError);
          errors.push({ id: recurring.id, error: updateError.message });
          continue;
        }

        processed.push(recurring.id);
        console.log(`Processed recurring transaction ${recurring.id}, next run: ${nextDate.toISOString().split('T')[0]}`);
      } catch (err) {
        console.error(`Unexpected error processing ${recurring.id}:`, err);
        errors.push({ id: recurring.id, error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processed.length,
        errors: errors.length,
        details: { processed, errors },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in process-recurring-transactions:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateNextRunDate(currentDate: Date, frequency: string): Date {
  const next = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  
  return next;
}
