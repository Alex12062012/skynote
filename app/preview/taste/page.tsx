import { LandingPage } from "@/components/marketing/LandingPage"

export const metadata = { title: "Preview · Landing taste" }

// Route de preview publique (pas de redirection auth) pour comparer les versions.
export default function PreviewTaste() {
  return <LandingPage isBeta />
}
