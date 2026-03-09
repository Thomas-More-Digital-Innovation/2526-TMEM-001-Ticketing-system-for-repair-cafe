'use server'

import prisma from '@/lib/prisma'
import { getServerActionUser } from '@/lib/auth-server'
import { revalidatePath } from 'next/cache'

interface CreateCafedagInput {
    cafeId: number
    startDatum: Date | string
    eindDatum: Date | string
}

function parseCalendarDate(dateInput: Date | string) {
    if (typeof dateInput === 'string') {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput)
        if (!match) return null

        const year = Number.parseInt(match[1], 10)
        const month = Number.parseInt(match[2], 10)
        const day = Number.parseInt(match[3], 10)

        if (
            Number.isNaN(year) ||
            Number.isNaN(month) ||
            Number.isNaN(day) ||
            month < 1 ||
            month > 12 ||
            day < 1 ||
            day > 31
        ) {
            return null
        }

        return new Date(Date.UTC(year, month - 1, day))
    }

    const normalizedDate = new Date(dateInput)
    if (Number.isNaN(normalizedDate.getTime())) {
        return null
    }

    return new Date(Date.UTC(
        normalizedDate.getUTCFullYear(),
        normalizedDate.getUTCMonth(),
        normalizedDate.getUTCDate()
    ))
}

function toStartOfDayUTC(date: Date) {
    const normalizedDate = new Date(date)
    normalizedDate.setUTCHours(0, 0, 0, 0)
    return normalizedDate
}

function toEndOfDayUTC(date: Date) {
    const normalizedDate = new Date(date)
    normalizedDate.setUTCHours(23, 59, 59, 999)
    return normalizedDate
}

// Create a new cafedag
export async function createCafedag(data: CreateCafedagInput) {
    try {
        await getServerActionUser(['Admin'])

        const parsedStartDatum = parseCalendarDate(data.startDatum)
        const parsedEindDatum = parseCalendarDate(data.eindDatum)

        if (!parsedStartDatum || !parsedEindDatum) {
            return { success: false, error: 'Ongeldige start- of einddatum' }
        }

        const startDatum = toStartOfDayUTC(parsedStartDatum)
        const eindDatum = toEndOfDayUTC(parsedEindDatum)

        if (eindDatum < startDatum) {
            return { success: false, error: 'Einddatum mag niet voor startdatum liggen' }
        }

        const cafedag = await prisma.cafedag.create({
            data: {
                cafeId: data.cafeId,
                startDatum,
                eindDatum,
            },
            include: {
                cafe: true,
            },
        })

        revalidatePath('/admin/cafedagen')
        return { success: true, cafedag }
    } catch (error) {
        console.error('Error creating cafedag:', error)
        return { success: false, error: 'Failed to create cafedag' }
    }
}

// Update an existing cafedag
export async function updateCafedag(
    cafedagId: number,
    data: Partial<CreateCafedagInput>
) {
    try {
        await getServerActionUser(['Admin'])

        const existingCafedag = await prisma.cafedag.findUnique({
            where: { cafedagId },
            select: { startDatum: true, eindDatum: true },
        })

        if (!existingCafedag) {
            return { success: false, error: 'Cafedag niet gevonden' }
        }

        const parsedStartDatum = data.startDatum
            ? parseCalendarDate(data.startDatum)
            : existingCafedag.startDatum
        const parsedEindDatum = data.eindDatum
            ? parseCalendarDate(data.eindDatum)
            : existingCafedag.eindDatum

        if (!parsedStartDatum || !parsedEindDatum) {
            return { success: false, error: 'Ongeldige start- of einddatum' }
        }

        const startDatum = toStartOfDayUTC(parsedStartDatum)
        const eindDatum = toEndOfDayUTC(parsedEindDatum)

        if (eindDatum < startDatum) {
            return { success: false, error: 'Einddatum mag niet voor startdatum liggen' }
        }

        const cafedag = await prisma.cafedag.update({
            where: { cafedagId },
            data: {
                ...(data.cafeId && { cafeId: data.cafeId }),
                startDatum,
                eindDatum,
            },
            include: {
                cafe: true,
            },
        })

        revalidatePath('/admin/cafedagen')
        return { success: true, cafedag }
    } catch (error) {
        console.error('Error updating cafedag:', error)
        return { success: false, error: 'Failed to update cafedag' }
    }
}

// Delete a cafedag
export async function deleteCafedag(cafedagId: number) {
    try {
        await getServerActionUser(['Admin'])

        await prisma.cafedag.update({
            where: { cafedagId },
            data: { inactive: true },
        })

        revalidatePath('/admin/cafedagen')
        return { success: true }
    } catch (error) {
        console.error('Error deleting cafedag:', error)
        return { success: false, error: 'Failed to delete cafedag' }
    }
}

// Create a new cafe
export async function createCafe(
    naam: string,
    locatie: string,
    cafePatroon: string
) {
    try {
        await getServerActionUser(['Admin'])

        const cafe = await prisma.cafe.create({
            data: {
                naam,
                locatie,
                cafePatroon,
            },
        })

        revalidatePath('/admin/cafedagen')
        return { success: true, cafe }
    } catch (error) {
        console.error('Error creating cafe:', error)
        return { success: false, error: 'Failed to create cafe' }
    }
}

// Update an existing cafe
export async function updateCafe(
    cafeId: number,
    naam: string,
    locatie: string,
    cafePatroon: string
) {
    try {
        await getServerActionUser(['Admin'])

        const cafe = await prisma.cafe.update({
            where: { cafeId },
            data: {
                naam,
                locatie,
                cafePatroon,
            },
        })

        revalidatePath('/admin/cafedagen')
        return { success: true, cafe }
    } catch (error) {
        console.error('Error updating cafe:', error)
        return { success: false, error: 'Failed to update cafe' }
    }
}

// Delete a cafe
export async function deleteCafe(cafeId: number) {
    try {
        await getServerActionUser(['Admin'])

        await prisma.cafe.delete({
            where: { cafeId },
        })

        revalidatePath('/admin/cafedagen')
        return { success: true }
    } catch (error) {
        console.error('Error deleting cafe:', error)
        return { success: false, error: 'Failed to delete cafe' }
    }
}
