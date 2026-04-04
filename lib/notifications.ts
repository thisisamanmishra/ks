import { createClient } from '@/lib/supabase/server'

type NotificationType = 'project_assigned' | 'status_changed' | 'progress_updated' | 'file_uploaded' | 'new_message' | 'new_rating'

interface NotificationInput {
  userId: number
  type: NotificationType
  title: string
  message: string
  projectId?: number
}

export async function createNotification(input: NotificationInput) {
  try {
    const supabase = await createClient()
    await supabase.from('notifications').insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      project_id: input.projectId || null,
    })
  } catch (err) {
    console.error('Failed to create notification:', err)
  }
}

export async function createMultipleNotifications(inputs: NotificationInput[]) {
  try {
    const supabase = await createClient()
    await supabase.from('notifications').insert(
      inputs.map(n => ({
        user_id: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        project_id: n.projectId || null,
      }))
    )
  } catch (err) {
    console.error('Failed to create notifications:', err)
  }
}
