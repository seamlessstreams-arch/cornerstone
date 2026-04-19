import { createSupabaseServerComponentClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/database.types'

type Tables = Database['public']['Tables']

type Organisation = Tables['organisations']['Row']
type Home = Tables['homes']['Row']
type Notification = Tables['notifications']['Row']

export async function listOrganisationsForCurrentUser() {
  const supabase = await createSupabaseServerComponentClient()
  const { data, error } = await supabase.from('organisations').select('*').order('name')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Organisation[]
}

export async function listHomesForOrganisation(organisationId: string) {
  const supabase = await createSupabaseServerComponentClient()
  const { data, error } = await supabase.from('homes').select('*').eq('organisation_id', organisationId).order('name')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Home[]
}

export async function listUnreadNotifications(limit = 10) {
  const supabase = await createSupabaseServerComponentClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Notification[]
}
