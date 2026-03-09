import prisma from '@/lib/prisma'

// GET all cafedagen with their cafe info
export async function getCafedagen() {
  try {
    const cafedagen = await prisma.cafedag.findMany({
      where: {
        inactive: false,
      },
      include: {
        cafe: true,
      },
      orderBy: {
        startDatum: 'desc',
      },
    })
    return cafedagen
  } catch (error) {
    console.error('Error fetching cafedagen:', error)
    throw new Error('Failed to fetch cafedagen')
  }
}

// GET all cafes
export async function getCafes() {
  try {
    const cafes = await prisma.cafe.findMany({
      orderBy: {
        naam: 'asc',
      },
    })
    return cafes
  } catch (error) {
    console.error('Error fetching cafes:', error)
    throw new Error('Failed to fetch cafes')
  }
}
