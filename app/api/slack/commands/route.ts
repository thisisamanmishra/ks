import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const command = formData.get('command'); // e.g., "/update-task"
    const text = formData.get('text'); // arguments e.g., "completed 12345"
    const userId = formData.get('user_id'); // slack user id
    const responseUrl = formData.get('response_url');

    if (command === '/update-task') {
      const args = typeof text === 'string' ? text.split(' ') : [];
      if (args.length < 2) {
        return NextResponse.json({
          response_type: 'ephemeral',
          text: 'Usage: /update-task [status] [task_id]\nStatus can be: To Do, In Progress, Completed'
        });
      }

      const rawStatus = args.slice(0, -1).join(' ').toLowerCase();
      const taskId = args[args.length - 1];
      
      let status = 'To Do';
      if (rawStatus.includes('progress')) status = 'In Progress';
      else if (rawStatus.includes('complete')) status = 'Completed';
      else if (rawStatus.includes('review')) status = 'In Review';

      const supabase = await createClient();
      
      // Verify user mapping (optional validation layer)
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('slack_user_id', userId)
        .single();
        
      if (!user) {
        return NextResponse.json({
          response_type: 'ephemeral',
          text: 'Please connect your Karyasaarthi account to Slack first.'
        });
      }

      const { data: updated, error } = await supabase
        .from('project_tasks')
        .update({ column_status: status })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({
          response_type: 'ephemeral',
          text: `Failed to update task: ${error.message}`
        });
      }

      return NextResponse.json({
        response_type: 'in_channel',
        text: `Task "${updated.title}" successfully marked as ${status}.`
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error handling Slack command:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
