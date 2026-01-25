'use server'

import { getKlantTypes } from '@/lib/data/klantTypes'

// Wrapper function so client components can import this via dynamic import
export async function getKlantTypesForClient() {
  return await getKlantTypes()
}
