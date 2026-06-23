import { NextResponse } from 'next/server'

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const Errors = {
  unauthorized:    () => new AppError('Non autorisé', 401, 'unauthorized'),
  notFound:        (res: string) => new AppError(`${res} introuvable`, 404, 'not_found'),
  badRequest:      (msg: string) => new AppError(msg, 400, 'bad_request'),
  insufficientNovas: () => new AppError('Novas insuffisantes', 402, 'insufficient_novas'),
  internal:        (msg = 'Erreur serveur') => new AppError(msg, 500, 'internal_error'),
}

export function apiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode },
    )
  }
  console.error('[API] Unhandled error:', error)
  return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
}
