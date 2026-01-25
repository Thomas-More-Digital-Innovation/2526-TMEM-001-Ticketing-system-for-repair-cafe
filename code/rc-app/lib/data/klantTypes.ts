import prisma from '@/lib/prisma'
import { cache } from 'react'

// GET all klant types - cached for request deduplication
export const getKlantTypes = cache(async () => {
  try {
    const types = await prisma.klantType.findMany({
      orderBy: { naam: 'asc' },
    })
    return types
  } catch (error) {
    console.error('Error fetching klant types:', error)
    throw new Error('Er is een fout opgetreden')
  }
})
