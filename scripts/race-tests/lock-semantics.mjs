import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('='))
  .map(l=>[l.slice(0,l.indexOf('=')).trim(), l.slice(l.indexOf('=')+1).trim()]))
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} })
const { data: u } = await db.from('courses').select('user_id').limit(1).single()
const uid = u.user_id
const K = `__test__:${crypto.randomUUID()}`
const acq = (ttl=120) => db.rpc('try_acquire_generation_lock',{p_lock_key:K,p_user_id:uid,p_ttl_seconds:ttl}).then(r=>r.data)
const rel = () => db.rpc('release_generation_lock',{p_lock_key:K})
const check = (label, got, want) => console.log(`${got===want?'  OK  ':' ECHEC'}  ${label} -> ${got} (attendu ${want})`)

check('1er appel prend le bail', await acq(), true)
check('2e appel refuse',          await acq(), false)
await rel()
check('apres release, reprenable', await acq(), true)

// Bail perime : un process mort (timeout Vercel) ne doit pas bloquer a vie.
check('TTL 0 s = bail expire, reprenable', await acq(0), true)
check('TTL 120 s juste apres = refuse',    await acq(120), false)
await rel()

// Deux cles differentes ne se genent pas (3 niveaux QCM en parallele).
const keys = ['peaceful','easy','medium'].map(d=>`__test__:${K}:${d}`)
const got = await Promise.all(keys.map(k=>db.rpc('try_acquire_generation_lock',{p_lock_key:k,p_user_id:uid,p_ttl_seconds:120}).then(r=>r.data)))
check('3 niveaux en parallele prennent chacun leur bail', JSON.stringify(got), JSON.stringify([true,true,true]))
for (const k of keys) await db.rpc('release_generation_lock',{p_lock_key:k})

const { count } = await db.from('generation_locks').select('lock_key',{count:'exact',head:true}).like('lock_key','__test__%')
check('aucun bail de test laisse derriere', count, 0)
