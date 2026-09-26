/**
 * Fiches reelles tirees de la prod (titres/resumes/points cles), pour que le
 * benchmark mesure la vraie tache et pas un cas jouet.
 */
export type Fiche = { title: string; summary: string; key_points: string[] }

export const FICHES: Fiche[] = [
  {
    title: 'Le cycle de Calvin',
    summary: "Le cycle de Calvin est la phase de la photosynthese qui fixe le carbone. Il se deroule dans le stroma du chloroplaste.",
    key_points: [
      'Se deroule dans le stroma, a partir du CO2 atmospherique',
      'Utilise l ATP et le NADPH produits par la phase claire',
      'Produit du glucose, reserve d energie de la plante',
    ],
  },
  {
    title: 'Evolution des premiers hommes',
    summary: "Les premiers representants du genre Homo apparaissent en Afrique il y a environ 3 millions d annees. Leur evolution est marquee par la fabrication d outils.",
    key_points: [
      'Homo habilis taille les premiers outils de pierre',
      'Homo erectus maitrise le feu et quitte l Afrique',
      'Homo sapiens apparait il y a environ 300 000 ans',
    ],
  },
  {
    title: 'Le theoreme de Pythagore',
    summary: "Dans un triangle rectangle, le carre de l hypotenuse egale la somme des carres des deux autres cotes. Il sert a calculer une longueur manquante.",
    key_points: [
      'Ne s applique qu aux triangles rectangles',
      'Formule : hypotenuse au carre = somme des carres des deux cotes',
      'Sa reciproque permet de prouver qu un triangle est rectangle',
    ],
  },
  {
    title: 'La Ve Republique',
    summary: "La Ve Republique est instauree en 1958 par Charles de Gaulle. Elle renforce fortement le pouvoir executif.",
    key_points: [
      'Constitution adoptee par referendum en 1958',
      'Le President est elu au suffrage universel direct depuis 1962',
      'Le Premier ministre est nomme par le President',
    ],
  },
]
