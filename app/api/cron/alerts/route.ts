import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendSlackMessage } from '@/lib/slack';

// Ensure this only runs dynamically (often required for Vercel Cron jobs depending on setup)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Authenticate chron request (standard practice via Authorization header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // 2. Discover overdue tasks
    const { data: overdueTasks } = await supabase
      .from('project_tasks')
      .select('*, project:service_requests(slack_channel_id), assignee:users(fullname, slack_user_id)')
      .lt('due_date', new Date().toISOString())
      .neq('column_status', 'Completed');

    if (overdueTasks && overdueTasks.length > 0) {
      for (const task of overdueTasks) {
        if (task.project?.slack_channel_id) {
          const mention = task.assignee?.slack_user_id ? `<@${task.assignee.slack_user_id}>` : task.assignee?.fullname || 'Unassigned';
          await sendSlackMessage(
            task.project.slack_channel_id,
            `⚠️ *Overdue Task Alert*\nTask: _${task.title}_\nAssignee: ${mention}\nPriority: ${task.priority}`
          );
        }
      }
    }

    // 3. Optional: Trigger daily summary or inactive vendors check
    // e.g. sendSlackMessage to admin channels about system health

    return NextResponse.json({ ok: true, processedOverrides: overdueTasks?.length || 0 });
  } catch (error) {
    console.error('Error executing cron alerts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
