import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/callback`;
  const scopes = [
    'channels:read',
    'channels:manage',
    'chat:write',
    'users:read',
    'commands',
  ].join(',');

  const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&user_scope=&redirect_uri=${encodeURIComponent(redirectUri)}&state=${userId}`;

  return NextResponse.redirect(slackAuthUrl);
}
