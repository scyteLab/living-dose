/** The server side of personal sync (supabase/migrations/0011_personal_sync.sql). */
import { supabase } from '@/lib/supabase'
import { unwrap } from '@/lib/serverError'

export const syncApi = (userId) => ({
  list: async () => unwrap(await supabase.from('user_documents').select('kind, data, updated_at')),
  put: async (kind, data) => unwrap(await supabase.from('user_documents').upsert({ user_id: userId, kind, data }).select('updated_at').single()),
  removeAll: async () => unwrap(await supabase.from('user_documents').delete().eq('user_id', userId)),
})
