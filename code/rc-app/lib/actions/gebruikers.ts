'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import crypto from 'node:crypto'

interface CreateGebruikerInput {
  gebruikerNaam: string
  naam: string
  wachtwoord: string
  gebruikerTypeId: number
  studentNummer?: string
}

export async function createGebruiker(data: CreateGebruikerInput) {
  try {
    // Check if this is a student (gebruikerTypeId 2 is typically student)
    const gebruikerType = await prisma.gebruikerType.findUnique({
      where: { gebruikerTypeId: data.gebruikerTypeId },
    })

    // If creating a student, check for active cafedag
    if (gebruikerType?.typeNaam.toLowerCase() === 'student') {
      const now = new Date()
      const activeCafedag = await prisma.cafedag.findFirst({
        where: {
          startDatum: { lte: now },
          eindDatum: { gte: now },
        },
        include: {
          cafe: true,
        },
      })

      if (!activeCafedag) {
        return {
          success: false,
          error: 'Er is geen actieve cafedag. Studenten kunnen alleen aangemaakt worden tijdens een actieve cafedag.',
        }
      }

      // Create the gebruiker
      const gebruiker = await prisma.gebruiker.create({
        data: {
          gebruikerNaam: data.gebruikerNaam,
          naam: data.naam,
          wachtwoord: data.wachtwoord, // In production, hash this password!
          gebruikerTypeId: data.gebruikerTypeId,
          ...(data.studentNummer && { studentNummer: data.studentNummer })
        },
        include: {
          gebruikerType: true,
        },
      })

      // Link student to active cafe
      await prisma.cafeGebruiker.create({
        data: {
          gebruikerId: gebruiker.gebruikerId,
          cafeId: activeCafedag.cafeId,
        },
      })

      revalidatePath('/admin/gebruikers')
      return { success: true, gebruiker }
    } else {
      // Non-student users don't need cafe link
      const gebruiker = await prisma.gebruiker.create({
        data: {
          gebruikerNaam: data.gebruikerNaam,
          naam: data.naam,
          wachtwoord: data.wachtwoord, // In production, hash this password!
          gebruikerTypeId: data.gebruikerTypeId,
          ...(data.studentNummer && { studentNummer: data.studentNummer })
        },
        include: {
          gebruikerType: true,
        },
      })

      revalidatePath('/admin/gebruikers')
      return { success: true, gebruiker }
    }
  } catch (error) {
    console.error('Error creating gebruiker:', error)
    return { success: false, error: 'Failed to create gebruiker' }
  }
}

// Update an existing gebruiker
export async function updateGebruiker(
  gebruikerId: number,
  data: {
    gebruikerNaam?: string
    naam?: string
    wachtwoord?: string
    gebruikerTypeId?: number
    studentNummer?: string
  }
) {
  try {
    const updateData: any = {}
    if (data.gebruikerNaam) updateData.gebruikerNaam = data.gebruikerNaam
    if (data.naam) updateData.naam = data.naam
    if (data.wachtwoord) updateData.wachtwoord = data.wachtwoord // In production, hash this!
    if (data.gebruikerTypeId) updateData.gebruikerTypeId = data.gebruikerTypeId
    if (data.studentNummer) updateData.studentNummer = data.studentNummer

    const gebruiker = await prisma.gebruiker.update({
      where: { gebruikerId },
      data: updateData,
      include: {
        gebruikerType: true,
      },
    })

    revalidatePath('/admin/gebruikers')
    return { success: true, gebruiker }
  } catch (error) {
    console.error('Error updating gebruiker:', error)
    return { success: false, error: 'Failed to update gebruiker' }
  }
}

// Delete a gebruiker
export async function deleteGebruiker(gebruikerId: number) {
  try {
    await prisma.gebruiker.delete({
      where: { gebruikerId },
    })

    revalidatePath('/admin/gebruikers')
    return { success: true }
  } catch (error) {
    console.error('Error deleting gebruiker:', error)
    return { success: false, error: 'Failed to delete gebruiker' }
  }
}

export async function generateQRLoginToken(gebruikerId: number) {
  try {
    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex')

    // Create QR login entry
    const qrLogin = await prisma.qRLogin.create({
      data: {
        token,
        gebruikerId,
      },
    })

    return { success: true, token: qrLogin.token }
  } catch (error) {
    console.error('Error generating QR login token:', error)
    return { success: false, error: 'Failed to generate QR login token' }
  }
}
