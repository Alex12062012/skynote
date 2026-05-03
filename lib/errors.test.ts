import { describe, it, expect } from 'vitest'
import { AppError, Errors, apiError } from './errors'

describe('AppError', () => {
  it('stocke message, statusCode et code', () => {
    const e = new AppError('test', 404, 'not_found')
    expect(e.message).toBe('test')
    expect(e.statusCode).toBe(404)
    expect(e.code).toBe('not_found')
    expect(e.name).toBe('AppError')
  })

  it('statusCode par défaut = 500', () => {
    const e = new AppError('oops')
    expect(e.statusCode).toBe(500)
  })
})

describe('Errors factory', () => {
  it('unauthorized → 401', () => {
    const e = Errors.unauthorized()
    expect(e.statusCode).toBe(401)
    expect(e.code).toBe('unauthorized')
  })

  it('notFound → 404 avec le nom de la ressource', () => {
    const e = Errors.notFound('Cours')
    expect(e.statusCode).toBe(404)
    expect(e.message).toContain('Cours')
  })

  it('badRequest → 400', () => {
    const e = Errors.badRequest('champ requis')
    expect(e.statusCode).toBe(400)
    expect(e.message).toContain('champ requis')
  })

  it('insufficientNovas → 402', () => {
    const e = Errors.insufficientNovas()
    expect(e.statusCode).toBe(402)
    expect(e.code).toBe('insufficient_novas')
  })

  it('internal → 500', () => {
    const e = Errors.internal()
    expect(e.statusCode).toBe(500)
  })

  it('internal avec message custom', () => {
    const e = Errors.internal('DB timeout')
    expect(e.message).toBe('DB timeout')
  })
})

describe('apiError', () => {
  it('AppError → status HTTP correct', async () => {
    const res = apiError(new AppError('test', 422, 'validation'))
    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toBe('test')
    expect(body.code).toBe('validation')
  })

  it('erreur inconnue → 500', async () => {
    const res = apiError(new Error('boom'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Erreur serveur')
  })

  it('erreur string → 500', async () => {
    const res = apiError('quelque chose')
    expect(res.status).toBe(500)
  })
})
