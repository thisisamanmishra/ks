import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state'); // User ID passed in auth route
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?slack_error=${error}`);
  }

  if (!code || !userId) {
    return NextResponse.json({ error: 'Missing code or state parameters' }, { status: 400 });
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/callback`;

  try {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Slack OAuth Error:', data.error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?slack_error=${data.error}`);
    }

    const slackUserId = data.authed_user.id;
    const slackTeamId = data.team.id;
    
    // Also save data.access_token if needed, but bot token is usually preferred
    
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from('users')
      .update({
        slack_user_id: slackUserId,
        slack_team_id: slackTeamId,
        slack_connected: true,
      })
      .eq('id', userId);

    if (dbError) {
      console.error('DB Update Error:', dbError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?slack_error=db_update_failed`);
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?slack_connected=true`);
  } catch (err) {
    console.error('Unexpected error during Slack OAuth:', err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile?slack_error=server_error`);
  }
}
