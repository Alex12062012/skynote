/**
 * Vrai si la requete porte un cookie de session Supabase (`sb-<ref>-auth-token`,
 * eventuellement decoupe en `.0`, `.1`…). Sans ce cookie, il n'y a aucune
 * session a verifier ni a rafraichir : on evite un aller-retour reseau vers
 * Supabase Auth pour chaque visiteur anonyme (landing, pricing, login).
 * Fichier sans dependance next/headers : importable depuis le middleware edge.
 */
export function hasSupabaseSessionCookie(cookieList: { name: string }[]): boolean {
  return cookieList.some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
}
