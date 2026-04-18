export type * from './database'
export interface ActionResult<T = void> { data?: T; error?: string }
