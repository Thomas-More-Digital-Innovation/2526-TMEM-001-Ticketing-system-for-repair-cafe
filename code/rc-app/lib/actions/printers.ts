'use server'

import { prisma } from '@/lib/prisma'
import { getServerActionUser } from '@/lib/auth-server'
import { revalidatePath } from 'next/cache'

/**
 * Get all printers with their connection status
 */
export async function getAllPrinters() {
  try {
    await getServerActionUser(['Admin'])

    const printers = await prisma.printer.findMany({
      orderBy: {
        printerNaam: 'asc',
      },
      include: {
        _count: {
          select: {
            printJobs: true,
          },
        },
      },
    })

    return { success: true, printers }
  } catch (error) {
    console.error('Error fetching printers:', error)
    return { success: false, error: 'Fout bij ophalen van printers' }
  }
}

/**
 * Get a single printer by ID
 */
export async function getPrinterById(printerId: number) {
  try {
    await getServerActionUser(['Admin'])

    const printer = await prisma.printer.findUnique({
      where: { printerId },
      include: {
        printJobs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        },
      },
    })

    if (!printer) {
      return { success: false, error: 'Printer niet gevonden' }
    }

    return { success: true, printer }
  } catch (error) {
    console.error('Error fetching printer:', error)
    return { success: false, error: 'Fout bij ophalen van printer' }
  }
}

/**
 * Get all connected printers
 */
export async function getConnectedPrinters() {
  try {
    await getServerActionUser(['Admin'])

    const printers = await prisma.printer.findMany({
      where: {
        isConnected: true,
      },
      orderBy: {
        printerNaam: 'asc',
      },
    })

    return { success: true, printers }
  } catch (error) {
    console.error('Error fetching connected printers:', error)
    return { success: false, error: 'Fout bij ophalen van verbonden printers' }
  }
}

/**
 * Create a new print job
 */
export async function createPrintJob(data: {
  printerId: number
  voorwerpId: number
  volgnummer: string
  klantType: string
  afdelingNaam: string
  voorwerpBeschrijving?: string
  klachtBeschrijving?: string
  printData?: any // Additional JSON data (e.g., payment details, materials)
}) {
  try {
    await getServerActionUser(['Admin', 'Balie', 'Student'])

    const printJob = await prisma.printJob.create({
      data: {
        printerId: data.printerId,
        voorwerpId: data.voorwerpId,
        volgnummer: data.volgnummer,
        klantNaam: data.klantType, // Store klantType in klantNaam field temporarily
        klantTelefoon: null, // No longer used
        afdelingNaam: data.afdelingNaam,
        printData: data.printData || null,
        status: 'pending',
      },
    })

    revalidatePath('/admin/statistieken')

    return { success: true, printJob }
  } catch (error) {
    console.error('Error creating print job:', error)
    return { success: false, error: 'Fout bij aanmaken van printjob' }
  }
}

/**
 * Get all print jobs with optional filtering
 */
export async function getPrintJobs(filters?: {
  printerId?: number
  status?: string
  limit?: number
}) {
  try {
    await getServerActionUser(['Admin'])

    const where: any = {}

    if (filters?.printerId) {
      where.printerId = filters.printerId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    const printJobs = await prisma.printJob.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: filters?.limit || 100,
      include: {
        printer: true,
      },
    })

    return { success: true, printJobs }
  } catch (error) {
    console.error('Error fetching print jobs:', error)
    return { success: false, error: 'Fout bij ophalen van printjobs' }
  }
}

/**
 * Get pending print jobs count
 */
export async function getPendingPrintJobsCount(printerId?: number) {
  try {
    await getServerActionUser(['Admin'])

    const where: any = { status: 'pending' }

    if (printerId) {
      where.printerId = printerId
    }

    const count = await prisma.printJob.count({
      where,
    })

    return { success: true, count }
  } catch (error) {
    console.error('Error counting pending print jobs:', error)
    return { success: false, error: 'Fout bij tellen van openstaande printjobs' }
  }
}

/**
 * Delete old completed print jobs (cleanup)
 */
export async function deleteOldPrintJobs(daysOld: number = 30) {
  try {
    await getServerActionUser(['Admin'])

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await prisma.printJob.deleteMany({
      where: {
        status: 'completed',
        completedAt: {
          lt: cutoffDate,
        },
      },
    })

    revalidatePath('/admin/statistieken')

    return {
      success: true,
      deletedCount: result.count,
      message: `${result.count} oude printjobs verwijderd`
    }
  } catch (error) {
    console.error('Error deleting old print jobs:', error)
    return { success: false, error: 'Fout bij verwijderen van oude printjobs' }
  }
}

/**
 * Retry a failed print job
 */
export async function retryPrintJob(printJobId: number) {
  try {
    await getServerActionUser(['Admin'])

    const printJob = await prisma.printJob.update({
      where: { printJobId },
      data: {
        status: 'pending',
        sentAt: null,
        completedAt: null,
        errorMessage: null,
      },
    })

    revalidatePath('/admin/statistieken')

    return { success: true, printJob }
  } catch (error) {
    console.error('Error retrying print job:', error)
    return { success: false, error: 'Fout bij opnieuw proberen van printjob' }
  }
}
