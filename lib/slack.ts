import { WebClient } from '@slack/web-api';

// Cache instances
let slackClient: WebClient | null = null;

export const getSlackClient = (token?: string) => {
  const botToken = token || process.env.SLACK_BOT_TOKEN;
  if (!botToken) {
    console.warn('Slack bot token is not configured.');
    return undefined;
  }
  if (!slackClient || token) {
    slackClient = new WebClient(botToken);
  }
  return slackClient;
};

/**
 * Send a message to a specific channel
 */
export async function sendSlackMessage(channel: string, text: string) {
  const client = getSlackClient();
  if (!client) return null;

  try {
    const result = await client.chat.postMessage({
      channel,
      text,
    });
    return result;
  } catch (error) {
    console.error('Error sending Slack message:', error);
    throw error;
  }
}

/**
 * Creates a new Slack channel for a project and invites participants by their Slack IDs
 */
export async function createProjectChannel(projectName: string, userSlackIds: string[] = []) {
  const client = getSlackClient();
  if (!client) return null;

  try {
    // Format channel name (lowercase, no spaces, max 80 chars)
    const channelName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 80);
    
    const result = await client.conversations.create({
      name: channelName,
      is_private: false, // Or true based on requirements
    });

    const channelId = result.channel?.id;

    if (channelId && userSlackIds.length > 0) {
      await client.conversations.invite({
        channel: channelId,
        users: userSlackIds.join(','),
      });
    }

    return channelId;
  } catch (error) {
    console.error('Error creating project channel:', error);
    throw error;
  }
}

/**
 * Gets a daily summary to post
 */
export async function postDailySummary(channel: string) {
  // Logic to fetch daily stats from supabase and post to slack
  await sendSlackMessage(channel, "Here is your daily project summary: N tasks completed.");
}
