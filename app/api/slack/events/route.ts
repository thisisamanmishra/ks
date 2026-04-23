import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // URL Verification strictly for initial Slack App configuration
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    // Process event wrapper
    if (body.type === 'event_callback') {
      const event = body.event;
      
      // Specifically look for message events in tracked channels
      if (event.type === 'message' && !event.bot_id) {
        // Here we could sync messages back into the Karyasaarthi platform
        // for instance, if we track the channel in the DB.
        
        const supabase = await createClient();
        
        // Find which project this channel belongs to
        const { data: project } = await supabase
          .from('service_requests')
          .select('id')
          .eq('slack_channel_id', event.channel)
          .single();

        if (project) {
          // If we want to record the message into an internal chat logs table:
          // For now, logging to console represents bi-directional sync start
          console.log(`Received slack message in project ${project.id}: ${event.text}`);
          
          /*
          await supabase.from('direct_messages').insert({
             project_id: project.id,
             // needs mapping from slack user true identity
             content: event.text,
          });
          */
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error handling Slack event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
