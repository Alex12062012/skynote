import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec la clé service_role.
 *
 * Bypass RLS ET nécessaire pour appeler les RPC sensibles
 * (increment_coins, award_coins, spend_coins, perform_prestige,
 * add_novas, deduct_novas) qui sont réservées à service_role
 * depuis la migration 025_secure_currency_rpcs.sql.
 *
 * À utiliser UNIQUEMENT dans du code serveur ('use server' / route
 * handler) où l'identité de l'utilisateur a déjà été vérifiée via
 * un client de session (createClient() de ./server + auth.getUser()).
 * Ne jamais exposer ce client ou la clé service_role au navigateur.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
