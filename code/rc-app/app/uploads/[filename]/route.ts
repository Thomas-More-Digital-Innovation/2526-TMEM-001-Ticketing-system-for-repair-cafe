import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, basename, extname } from 'path'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

function getContentType(filename: string): string {
  const extension = extname(filename).toLowerCase()

  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.gif':
      return 'image/gif'
    case '.webp':
      return 'image/webp'
    case '.svg':
      return 'image/svg+xml'
    case '.bmp':
      return 'image/bmp'
    case '.avif':
      return 'image/avif'
    default:
      return 'application/octet-stream'
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params
    const safeFilename = basename(filename)
    const filePath = join(UPLOAD_DIR, safeFilename)

    if (!existsSync(filePath)) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const fileBuffer = await readFile(filePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': getContentType(safeFilename),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving uploaded file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
