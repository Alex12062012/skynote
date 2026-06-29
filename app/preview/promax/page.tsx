import { LandingPageProMax } from "@/components/marketing/LandingPageProMax"

export const metadata = { title: "Preview · Landing ui-ux-pro-max" }

// Route de preview publique (pas de redirection auth) pour comparer les versions.
export default function PreviewProMax() {
  return <LandingPageProMax isBeta />
}
