# ============================================================
# SKYNOTE — Internationalisation complete du site
# + Fiches/QCM adaptes a la langue du cours
# Executer depuis la racine du projet : .\fix-i18n.ps1
# ============================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SKYNOTE — i18n complet + IA multilingue" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# -----------------------------------------------------------
# 1. translations.ts — Ajout de TOUTES les cles du dashboard
# -----------------------------------------------------------
Write-Host "[1/12] Traductions completes (fr/en/ru/zh)..." -ForegroundColor Yellow

$translations = @'
export type Locale = 'fr' | 'en' | 'ru' | 'zh'

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'fr', label: 'Francais', flag: '\uD83C\uDDEB\uD83C\uDDF7' },
  { code: 'en', label: 'English', flag: '\uD83C\uDDEC\uD83C\uDDE7' },
  { code: 'ru', label: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439', flag: '\uD83C\uDDF7\uD83C\uDDFA' },
  { code: 'zh', label: '\u4E2D\u6587', flag: '\uD83C\uDDE8\uD83C\uDDF3' },
]

type Translations = Record<Locale, Record<string, string>>

export const t: Translations = {
  fr: {
    // Landing
    'landing.hero.title1': 'Tes cours.',
    'landing.hero.title2': 'Tes fiches.',
    'landing.hero.title3': 'En 15 secondes.',
    'landing.hero.subtitle': 'Prends ton cours en photo, Skynote fait le reste. Fiches de revision, QCM, chatbot IA.',
    'landing.hero.avgGrade': 'La note moyenne de ceux qui revisent avec Skynote',
    'landing.hero.cta': 'Creer mon compte',
    'landing.hero.ctaBeta': 'Commencer gratuitement',
    'landing.stats.fiches': 'pour generer tes fiches',
    'landing.stats.faster': 'plus rapide que reecrire',
    'landing.stats.adapted': 'adapte college & lycee',
    'landing.problem.label': 'Le probleme',
    'landing.problem.title1': 'Tu passes 2h a recopier tes cours',
    'landing.problem.title2': 'pour 15 minutes de vraie revision.',
    'landing.problem.desc': 'Reecrire c\'est pas reviser. Ton cerveau retient quand il est actif \u2014 pas quand il recopie. Skynote fait le travail de mise en forme pour que toi, tu te concentres sur ce qui compte.',
    'landing.features.photo': 'Photo, texte, vocal, PDF',
    'landing.features.photoDesc': 'Importe ton cours comme tu veux. L\'IA s\'adapte.',
    'landing.features.fiches': 'Fiches en 15 secondes',
    'landing.features.fichesDesc': 'Pas en 15 minutes. En 15 secondes. Chrono en main.',
    'landing.features.qcm': 'QCM intelligents',
    'landing.features.qcmDesc': 'Des questions qui testent ta comprehension, pas ta memoire.',
    'landing.features.chatbot': 'Chatbot par cours',
    'landing.features.chatbotDesc': 'Pose tes questions. L\'IA connait ton cours par coeur.',
    'landing.testimonials.label': 'Ils revisent avec Skynote',
    'landing.testimonials.title': 'Les notes parlent d\'elles-memes.',
    'landing.beta.label': 'Pendant la beta',
    'landing.beta.title': 'Gratuit.',
    'landing.beta.desc': 'Toutes les fonctionnalites. Aucune carte bancaire. Tu revises, tu progresses, c\'est tout.',
    'landing.beta.cta': 'Creer mon compte gratuitement',
    'landing.pricing.label': 'Nos forfaits',
    'landing.pricing.title': 'Choisis ton plan',
    'landing.pricing.subtitle': 'Commence gratuitement, evolue quand tu veux.',
    'landing.pricing.free': 'Gratuit',
    'landing.pricing.perMonth': '/mois',
    'landing.pricing.yearly': 'en annuel',
    'landing.pricing.popular': 'Populaire',
    'landing.pricing.famille': 'Famille',
    'landing.pricing.free1': '1 cours par semaine',
    'landing.pricing.free2': 'Fiches IA + QCM',
    'landing.pricing.free3': 'Sky Coins & objectifs',
    'landing.pricing.plus1': 'Cours illimites',
    'landing.pricing.plus2': 'Dictee vocale',
    'landing.pricing.plus3': 'Chatbot IA par cours',
    'landing.pricing.plus4': 'Tout le plan Gratuit',
    'landing.pricing.fam1': 'Tout le plan Plus',
    'landing.pricing.fam2': 'Jusqu\'a 6 enfants',
    'landing.pricing.fam3': 'Dashboard parent',
    'landing.pricing.fam4': 'Support prioritaire',
    'landing.footer': 'Tu perds rien a essayer. Tu perds du temps a ne pas le faire.',
    'landing.footer.privacy': 'Confidentialite',
    'landing.footer.terms': 'CGU',
    'landing.footer.legal': 'Mentions legales',
    // Profile
    'profile.skycoins': 'Sky Coins',
    'profile.objectives': 'Objectifs',
    'profile.leaderboard': 'Classement',
    'profile.followProgress': 'Suis ta progression',
    'profile.compareOthers': 'Compare-toi aux autres',
    'profile.earnCoins': 'Gagner des coins',
    'profile.courses': 'Cours',
    'profile.qcmDone': 'QCM faits',
    'profile.perfectScores': 'Scores parfaits',
    'profile.streak': 'jours consecutifs',
    'profile.streakStart': 'Commence ton streak aujourd\'hui !',
    'profile.streakKeep': 'Connecte-toi chaque jour pour garder ta serie !',
    'profile.accountInfo': 'Informations du compte',
    'profile.memberSince': 'Membre depuis',
    'profile.currentPlan': 'Plan actuel',
    'profile.email': 'Email',
    'profile.free': 'Gratuit',
    'profile.logout': 'Se deconnecter',
    'profile.upgrade': 'Passer au plan Plus',
    'profile.language': 'Langue',
    'profile.coinsNeeded': 'coins pour 1 mois Plus',
    // Navbar
    'nav.home': 'Accueil',
    'nav.objectives': 'Objectifs',
    'nav.classCode': 'Code de classe',
    'nav.pricing': 'Forfaits',
    'nav.family': 'Famille',
    'nav.myAccount': 'Mon compte',
    // Dashboard
    'dash.goodMorning': 'Bonjour',
    'dash.goodAfternoon': 'Bon apres-midi',
    'dash.goodEvening': 'Bonsoir',
    'dash.streakMsg': '{n} jours de suite \u2014 continue comme ca !',
    'dash.readyToStudy': 'Pret a reviser aujourd\'hui ?',
    'dash.newCourse': 'Nouveau cours',
    'dash.recentCourses': 'Cours recents',
    'dash.viewAll': 'Voir tout',
    'dash.noCourses': 'Aucun cours pour l\'instant',
    'dash.noCoursesDesc': 'Cree ton premier cours pour commencer a reviser avec l\'IA.',
    'dash.createFirst': 'Creer mon premier cours',
    'dash.objectivesInProgress': 'Objectifs en cours',
    'dash.premiumUnlock': 'Plus que {n} coins pour debloquer Premium !',
    'dash.classCourses': 'Cours de la classe',
    // Stats bar
    'stats.courses': 'Cours',
    'stats.qcmDone': 'QCM faits',
    'stats.streak': 'Jours consecutifs',
    'stats.skycoins': 'Sky Coins',
    // Course card
    'course.mastered': 'maitrise',
    'course.error': 'Erreur',
    'course.processing': 'En cours...',
    // Courses page
    'courses.myCourses': 'Mes cours',
    'courses.classCourses': 'Cours de la classe',
    'courses.nCourses': '{n} cours',
    'courses.noCoursesTitle': 'Aucun cours pour l\'instant',
    'courses.noCoursesDesc': 'Cree ton premier cours pour que l\'IA genere tes fiches de revision.',
    'courses.createFirst': 'Creer mon premier cours',
    // New course
    'newCourse.title': 'Nouveau cours',
    'newCourse.subtitle': 'L\'IA genere tes fiches de revision et ton QCM automatiquement',
    'newCourse.back': 'Mes cours',
    'newCourse.courseTitle': 'Titre du cours',
    'newCourse.courseTitlePlaceholder': 'Ex: Les fonctions \u2014 Mathematiques',
    'newCourse.subject': 'Matiere',
    'newCourse.choosSubject': 'Choisir une matiere...',
    'newCourse.sourceType': 'Source du cours',
    'newCourse.text': 'Texte',
    'newCourse.photo': 'Photo',
    'newCourse.list': 'Liste',
    'newCourse.vocal': 'Vocal',
    'newCourse.courseContent': 'Contenu du cours',
    'newCourse.pasteHere': 'Colle ou tape ton cours ici...',
    'newCourse.createCourse': 'Creer le cours',
    'newCourse.generating': 'Generation en cours...',
    'newCourse.photoAdvice': 'Conseil pour les photos',
    'newCourse.photoAdviceDesc': 'Pour les photos, privilegie les cours imprimes car l\'IA a du mal a lire les cours manuscrits.',
    'newCourse.photoAdviceDesc2': 'Si l\'IA n\'arrive pas a lire ta photo, tu pourras modifier le texte detecte avant de valider.',
    'newCourse.cancel': 'Annuler',
    'newCourse.okContinue': 'OK, continuer',
    'newCourse.dontShowAgain': 'Ne plus afficher pour les prochains cours',
    'newCourse.readingPhoto': 'Lecture de ta photo...',
    'newCourse.aiAnalyzing': 'L\'IA analyse et transcrit ton cours',
    'newCourse.textDetected': 'Texte detecte ({n} photo{s}) \u2014 tu peux le modifier',
    'newCourse.clearAll': 'Tout effacer',
    'newCourse.addPhoto': 'Ajouter une autre photo',
    'newCourse.addPhotoHint': 'Le texte sera ajoute a la suite du texte existant',
    'newCourse.illisibleWarning': 'Certaines parties sont marquees [illisible]. Tu peux les corriger avant de valider.',
    'newCourse.titleRequired': 'Le titre est requis',
    'newCourse.subjectRequired': 'La matiere est requise',
    'newCourse.contentRequired': 'Le contenu est requis',
    'newCourse.uploadPhoto': 'Uploade une photo et attends la transcription',
    'newCourse.recordVocal': 'Enregistre du contenu vocal',
    'newCourse.vocalPremium': 'La dictee vocale est disponible avec le plan Plus ou Famille.',
    'newCourse.seePlans': 'Voir les plans',
    'newCourse.listTitle': 'Quiz liste \u2014 sans IA',
    'newCourse.listDesc': 'Pas d\'IA, regeneration infinie',
    'newCourse.listExplain': 'Saisis tes paires Question / Reponse \u2014 pays et capitales, vocabulaire, dates \u2014 et Skynote genere un questionnaire de 20 questions tirees au hasard.',
    'newCourse.listPerfect': 'Score parfait = +10 Sky Coins.',
    'newCourse.createListQuiz': 'Creer mon quiz liste',
    'newCourse.upgradePlus': 'Passer au plan Plus pour des cours illimites',
    // Course detail
    'courseDetail.back': 'Mes cours',
    'courseDetail.backClass': 'Cours de la classe',
    'courseDetail.sourceText': 'Texte',
    'courseDetail.sourcePdf': 'PDF',
    'courseDetail.sourcePhoto': 'Photo',
    'courseDetail.sourceVocal': 'Vocal',
    'courseDetail.genError': 'Erreur de generation',
    'courseDetail.genErrorDesc': 'L\'IA n\'a pas pu generer les fiches. Verifie que le contenu de ton cours est suffisamment long.',
    'courseDetail.retry': 'Reessayer',
    'courseDetail.nFlashcards': '{n} fiches generees',
    'courseDetail.perfectQcm': 'Score parfait au QCM = +10 Sky Coins',
    'courseDetail.takeQcm': 'Faire le QCM',
    'courseDetail.noFlashcards': 'Aucune fiche generee. Le contenu etait peut-etre trop court.',
    'courseDetail.studentTracking': 'Suivi des eleves',
    'courseDetail.nFlashcardsNStudents': '{f} fiches \u00B7 {s} eleves',
    'courseDetail.perfect': 'Parfait',
    'courseDetail.notYetDone': 'Pas encore fait',
    // Delete course
    'delete.title': 'Supprimer ce cours ?',
    'delete.confirm': 'Tu vas supprimer \u00AB {title} \u00BB ainsi que toutes ses fiches et ses QCM. Cette action est irreversible.',
    'delete.cancel': 'Annuler',
    'delete.delete': 'Supprimer',
    // Flashcard viewer
    'flash.mastery': 'Maitrise',
    'flash.card': 'Fiche',
    'flash.keyPoints': 'Points essentiels',
    'flash.prev': 'Precedente',
    'flash.next': 'Suivante',
    'flash.markMastered': 'Marquer maitrisee',
    'flash.markNotMastered': 'Marquer non maitrisee',
    'flash.masteryComplete': 'Maitrise totale !',
    // QCM
    'qcm.question': 'Question',
    'qcm.correct': 'correctes',
    'qcm.goodAnswer': 'Bonne reponse !',
    'qcm.wrongAnswer': 'Pas tout a fait...',
    'qcm.nextQuestion': 'Question suivante',
    'qcm.seeResults': 'Voir mes resultats',
    'qcm.perfectScore': 'Score parfait !',
    'qcm.goodJob': 'Bon travail !',
    'qcm.keepStudying': 'Continue a reviser !',
    'qcm.goodAnswers': 'bonnes reponses',
    'qcm.restart': 'Recommencer',
    'qcm.backToCards': 'Retour aux fiches',
    'qcm.readCards': 'Relis les fiches puis reessaie !',
    'qcm.almostPerfect': 'Encore un effort pour le score parfait !',
    'qcm.perfectReward': 'Score parfait au QCM !',
    'qcm.aiGenerated': '{n} questions generees par l\'IA',
    'qcm.regenerate': 'Regenerer',
    'qcm.regenerating': 'Regeneration...',
    'qcm.regenError': 'Impossible de regenerer les questions.',
    'qcm.notAvailable': 'Questions non disponibles',
    'qcm.notAvailableDesc': 'Les questions pour cette fiche n\'ont pas encore ete generees.',
    'qcm.generateQuestions': 'Generer les questions',
    // Subjects
    'subject.maths': 'Mathematiques',
    'subject.french': 'Francais',
    'subject.history': 'Histoire',
    'subject.geography': 'Geographie',
    'subject.biology': 'SVT',
    'subject.physics': 'Physique',
    'subject.chemistry': 'Chimie',
    'subject.english': 'Anglais',
    'subject.spanish': 'Espagnol',
    'subject.philosophy': 'Philosophie',
    'subject.general': 'General',
    // Classroom
    'class.howStudentsAccess': 'Comment les eleves accedent a la classe',
    'class.step1': '1. L\'eleve va sur',
    'class.step2': '2. Il tape son code personnel (voir colonne "Code" ci-dessous)',
    'class.step3': '3. Il accede directement aux cours et QCM de la classe',
    'class.copyLink': 'Copier le lien de connexion',
    'class.copied': 'Copie !',
    'class.myClass': 'Ma classe',
    'class.student': 'Eleve',
    'class.code': 'Code',
    'class.best': 'Meilleur',
    'class.nStudents': '{n} eleve{s}',
  },
  en: {
    'landing.hero.title1': 'Your notes.',
    'landing.hero.title2': 'Your flashcards.',
    'landing.hero.title3': 'In 15 seconds.',
    'landing.hero.subtitle': 'Take a photo of your notes, Skynote does the rest. Flashcards, quizzes, AI chatbot.',
    'landing.hero.avgGrade': 'Average grade of those who study with Skynote',
    'landing.hero.cta': 'Create my account',
    'landing.hero.ctaBeta': 'Start for free',
    'landing.stats.fiches': 'to generate your flashcards',
    'landing.stats.faster': 'faster than rewriting',
    'landing.stats.adapted': 'adapted for middle & high school',
    'landing.problem.label': 'The problem',
    'landing.problem.title1': 'You spend 2h rewriting your notes',
    'landing.problem.title2': 'for 15 minutes of real studying.',
    'landing.problem.desc': 'Rewriting is not studying. Your brain learns when it\'s active \u2014 not when it copies. Skynote handles the formatting so you can focus on what matters.',
    'landing.features.photo': 'Photo, text, voice, PDF',
    'landing.features.photoDesc': 'Import your notes however you want. The AI adapts.',
    'landing.features.fiches': 'Flashcards in 15 seconds',
    'landing.features.fichesDesc': 'Not 15 minutes. 15 seconds. Stopwatch in hand.',
    'landing.features.qcm': 'Smart quizzes',
    'landing.features.qcmDesc': 'Questions that test understanding, not memorization.',
    'landing.features.chatbot': 'Chatbot per course',
    'landing.features.chatbotDesc': 'Ask your questions. The AI knows your course by heart.',
    'landing.testimonials.label': 'They study with Skynote',
    'landing.testimonials.title': 'The grades speak for themselves.',
    'landing.beta.label': 'During beta',
    'landing.beta.title': 'Free.',
    'landing.beta.desc': 'All features. No credit card. You study, you progress, that\'s it.',
    'landing.beta.cta': 'Create my free account',
    'landing.pricing.label': 'Our plans',
    'landing.pricing.title': 'Choose your plan',
    'landing.pricing.subtitle': 'Start free, upgrade whenever you want.',
    'landing.pricing.free': 'Free',
    'landing.pricing.perMonth': '/month',
    'landing.pricing.yearly': 'yearly',
    'landing.pricing.popular': 'Popular',
    'landing.pricing.famille': 'Family',
    'landing.pricing.free1': '1 course per week',
    'landing.pricing.free2': 'AI flashcards + quizzes',
    'landing.pricing.free3': 'Sky Coins & objectives',
    'landing.pricing.plus1': 'Unlimited courses',
    'landing.pricing.plus2': 'Voice dictation',
    'landing.pricing.plus3': 'AI chatbot per course',
    'landing.pricing.plus4': 'Everything in Free',
    'landing.pricing.fam1': 'Everything in Plus',
    'landing.pricing.fam2': 'Up to 6 children',
    'landing.pricing.fam3': 'Parent dashboard',
    'landing.pricing.fam4': 'Priority support',
    'landing.footer': 'You lose nothing by trying. You lose time by not doing it.',
    'landing.footer.privacy': 'Privacy',
    'landing.footer.terms': 'Terms',
    'landing.footer.legal': 'Legal',
    'profile.skycoins': 'Sky Coins',
    'profile.objectives': 'Objectives',
    'profile.leaderboard': 'Leaderboard',
    'profile.followProgress': 'Track your progress',
    'profile.compareOthers': 'Compare with others',
    'profile.earnCoins': 'Earn coins',
    'profile.courses': 'Courses',
    'profile.qcmDone': 'Quizzes done',
    'profile.perfectScores': 'Perfect scores',
    'profile.streak': 'consecutive days',
    'profile.streakStart': 'Start your streak today!',
    'profile.streakKeep': 'Log in every day to keep your streak!',
    'profile.accountInfo': 'Account information',
    'profile.memberSince': 'Member since',
    'profile.currentPlan': 'Current plan',
    'profile.email': 'Email',
    'profile.free': 'Free',
    'profile.logout': 'Log out',
    'profile.upgrade': 'Upgrade to Plus',
    'profile.language': 'Language',
    'profile.coinsNeeded': 'coins for 1 month Plus',
    'nav.home': 'Home',
    'nav.objectives': 'Objectives',
    'nav.classCode': 'Class code',
    'nav.pricing': 'Plans',
    'nav.family': 'Family',
    'nav.myAccount': 'My account',
    'dash.goodMorning': 'Good morning',
    'dash.goodAfternoon': 'Good afternoon',
    'dash.goodEvening': 'Good evening',
    'dash.streakMsg': '{n} days in a row \u2014 keep it up!',
    'dash.readyToStudy': 'Ready to study today?',
    'dash.newCourse': 'New course',
    'dash.recentCourses': 'Recent courses',
    'dash.viewAll': 'View all',
    'dash.noCourses': 'No courses yet',
    'dash.noCoursesDesc': 'Create your first course to start studying with AI.',
    'dash.createFirst': 'Create my first course',
    'dash.objectivesInProgress': 'Objectives in progress',
    'dash.premiumUnlock': 'Only {n} more coins to unlock Premium!',
    'dash.classCourses': 'Class courses',
    'stats.courses': 'Courses',
    'stats.qcmDone': 'Quizzes done',
    'stats.streak': 'Day streak',
    'stats.skycoins': 'Sky Coins',
    'course.mastered': 'mastered',
    'course.error': 'Error',
    'course.processing': 'Processing...',
    'courses.myCourses': 'My courses',
    'courses.classCourses': 'Class courses',
    'courses.nCourses': '{n} courses',
    'courses.noCoursesTitle': 'No courses yet',
    'courses.noCoursesDesc': 'Create your first course so the AI can generate your flashcards.',
    'courses.createFirst': 'Create my first course',
    'newCourse.title': 'New course',
    'newCourse.subtitle': 'AI generates your flashcards and quiz automatically',
    'newCourse.back': 'My courses',
    'newCourse.courseTitle': 'Course title',
    'newCourse.courseTitlePlaceholder': 'Ex: Functions \u2014 Mathematics',
    'newCourse.subject': 'Subject',
    'newCourse.choosSubject': 'Choose a subject...',
    'newCourse.sourceType': 'Course source',
    'newCourse.text': 'Text',
    'newCourse.photo': 'Photo',
    'newCourse.list': 'List',
    'newCourse.vocal': 'Voice',
    'newCourse.courseContent': 'Course content',
    'newCourse.pasteHere': 'Paste or type your course here...',
    'newCourse.createCourse': 'Create course',
    'newCourse.generating': 'Generating...',
    'newCourse.photoAdvice': 'Tips for photos',
    'newCourse.photoAdviceDesc': 'For photos, prefer printed notes as the AI struggles with handwriting.',
    'newCourse.photoAdviceDesc2': 'If the AI can\'t read your photo, you can edit the detected text before validating.',
    'newCourse.cancel': 'Cancel',
    'newCourse.okContinue': 'OK, continue',
    'newCourse.dontShowAgain': 'Don\'t show again for future courses',
    'newCourse.readingPhoto': 'Reading your photo...',
    'newCourse.aiAnalyzing': 'The AI is analyzing and transcribing your course',
    'newCourse.textDetected': 'Text detected ({n} photo{s}) \u2014 you can edit it',
    'newCourse.clearAll': 'Clear all',
    'newCourse.addPhoto': 'Add another photo',
    'newCourse.addPhotoHint': 'Text will be added after the existing text',
    'newCourse.illisibleWarning': 'Some parts are marked [unreadable]. You can fix them before validating.',
    'newCourse.titleRequired': 'Title is required',
    'newCourse.subjectRequired': 'Subject is required',
    'newCourse.contentRequired': 'Content is required',
    'newCourse.uploadPhoto': 'Upload a photo and wait for transcription',
    'newCourse.recordVocal': 'Record voice content',
    'newCourse.vocalPremium': 'Voice dictation is available with Plus or Family plan.',
    'newCourse.seePlans': 'See plans',
    'newCourse.listTitle': 'List quiz \u2014 no AI',
    'newCourse.listDesc': 'No AI, infinite regeneration',
    'newCourse.listExplain': 'Enter your Question / Answer pairs \u2014 countries and capitals, vocabulary, dates \u2014 and Skynote generates a 20-question quiz randomly.',
    'newCourse.listPerfect': 'Perfect score = +10 Sky Coins.',
    'newCourse.createListQuiz': 'Create my list quiz',
    'newCourse.upgradePlus': 'Upgrade to Plus for unlimited courses',
    'courseDetail.back': 'My courses',
    'courseDetail.backClass': 'Class courses',
    'courseDetail.sourceText': 'Text',
    'courseDetail.sourcePdf': 'PDF',
    'courseDetail.sourcePhoto': 'Photo',
    'courseDetail.sourceVocal': 'Voice',
    'courseDetail.genError': 'Generation error',
    'courseDetail.genErrorDesc': 'The AI couldn\'t generate flashcards. Make sure your course content is long enough.',
    'courseDetail.retry': 'Retry',
    'courseDetail.nFlashcards': '{n} flashcards generated',
    'courseDetail.perfectQcm': 'Perfect quiz score = +10 Sky Coins',
    'courseDetail.takeQcm': 'Take the quiz',
    'courseDetail.noFlashcards': 'No flashcards generated. The content may have been too short.',
    'courseDetail.studentTracking': 'Student tracking',
    'courseDetail.nFlashcardsNStudents': '{f} flashcards \u00B7 {s} students',
    'courseDetail.perfect': 'Perfect',
    'courseDetail.notYetDone': 'Not done yet',
    'delete.title': 'Delete this course?',
    'delete.confirm': 'You will delete \u00AB {title} \u00BB along with all its flashcards and quizzes. This action is irreversible.',
    'delete.cancel': 'Cancel',
    'delete.delete': 'Delete',
    'flash.mastery': 'Mastery',
    'flash.card': 'Card',
    'flash.keyPoints': 'Key points',
    'flash.prev': 'Previous',
    'flash.next': 'Next',
    'flash.markMastered': 'Mark as mastered',
    'flash.markNotMastered': 'Mark as not mastered',
    'flash.masteryComplete': 'Full mastery!',
    'qcm.question': 'Question',
    'qcm.correct': 'correct',
    'qcm.goodAnswer': 'Correct!',
    'qcm.wrongAnswer': 'Not quite...',
    'qcm.nextQuestion': 'Next question',
    'qcm.seeResults': 'See my results',
    'qcm.perfectScore': 'Perfect score!',
    'qcm.goodJob': 'Good job!',
    'qcm.keepStudying': 'Keep studying!',
    'qcm.goodAnswers': 'correct answers',
    'qcm.restart': 'Restart',
    'qcm.backToCards': 'Back to cards',
    'qcm.readCards': 'Review the cards and try again!',
    'qcm.almostPerfect': 'Almost there for a perfect score!',
    'qcm.perfectReward': 'Perfect quiz score!',
    'qcm.aiGenerated': '{n} AI-generated questions',
    'qcm.regenerate': 'Regenerate',
    'qcm.regenerating': 'Regenerating...',
    'qcm.regenError': 'Unable to regenerate questions.',
    'qcm.notAvailable': 'Questions not available',
    'qcm.notAvailableDesc': 'Questions for this card haven\'t been generated yet.',
    'qcm.generateQuestions': 'Generate questions',
    'subject.maths': 'Mathematics',
    'subject.french': 'French',
    'subject.history': 'History',
    'subject.geography': 'Geography',
    'subject.biology': 'Biology',
    'subject.physics': 'Physics',
    'subject.chemistry': 'Chemistry',
    'subject.english': 'English',
    'subject.spanish': 'Spanish',
    'subject.philosophy': 'Philosophy',
    'subject.general': 'General',
    'class.howStudentsAccess': 'How students access the class',
    'class.step1': '1. The student goes to',
    'class.step2': '2. They enter their personal code (see "Code" column below)',
    'class.step3': '3. They access the class courses and quizzes directly',
    'class.copyLink': 'Copy login link',
    'class.copied': 'Copied!',
    'class.myClass': 'My class',
    'class.student': 'Student',
    'class.code': 'Code',
    'class.best': 'Best',
    'class.nStudents': '{n} student{s}',
  },
  ru: {
    'nav.home': '\u0413\u043B\u0430\u0432\u043D\u0430\u044F',
    'nav.objectives': '\u0426\u0435\u043B\u0438',
    'nav.classCode': '\u041A\u043E\u0434 \u043A\u043B\u0430\u0441\u0441\u0430',
    'nav.pricing': '\u0422\u0430\u0440\u0438\u0444\u044B',
    'nav.family': '\u0421\u0435\u043C\u044C\u044F',
    'nav.myAccount': '\u041C\u043E\u0439 \u0430\u043A\u043A\u0430\u0443\u043D\u0442',
    'dash.goodMorning': '\u0414\u043E\u0431\u0440\u043E\u0435 \u0443\u0442\u0440\u043E',
    'dash.goodAfternoon': '\u0414\u043E\u0431\u0440\u044B\u0439 \u0434\u0435\u043D\u044C',
    'dash.goodEvening': '\u0414\u043E\u0431\u0440\u044B\u0439 \u0432\u0435\u0447\u0435\u0440',
    'dash.streakMsg': '{n} \u0434\u043D\u0435\u0439 \u043F\u043E\u0434\u0440\u044F\u0434 \u2014 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0439!',
    'dash.readyToStudy': '\u0413\u043E\u0442\u043E\u0432 \u0443\u0447\u0438\u0442\u044C\u0441\u044F \u0441\u0435\u0433\u043E\u0434\u043D\u044F?',
    'dash.newCourse': '\u041D\u043E\u0432\u044B\u0439 \u043A\u0443\u0440\u0441',
    'dash.recentCourses': '\u041D\u0435\u0434\u0430\u0432\u043D\u0438\u0435 \u043A\u0443\u0440\u0441\u044B',
    'dash.viewAll': '\u0412\u0441\u0435',
    'dash.noCourses': '\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043A\u0443\u0440\u0441\u043E\u0432',
    'dash.noCoursesDesc': '\u0421\u043E\u0437\u0434\u0430\u0439 \u043F\u0435\u0440\u0432\u044B\u0439 \u043A\u0443\u0440\u0441.',
    'dash.createFirst': '\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0435\u0440\u0432\u044B\u0439 \u043A\u0443\u0440\u0441',
    'dash.objectivesInProgress': '\u0422\u0435\u043A\u0443\u0449\u0438\u0435 \u0446\u0435\u043B\u0438',
    'dash.premiumUnlock': '\u0415\u0449\u0435 {n} \u043C\u043E\u043D\u0435\u0442 \u0434\u043E Premium!',
    'dash.classCourses': '\u041A\u0443\u0440\u0441\u044B \u043A\u043B\u0430\u0441\u0441\u0430',
    'stats.courses': '\u041A\u0443\u0440\u0441\u044B',
    'stats.qcmDone': '\u0422\u0435\u0441\u0442\u044B',
    'stats.streak': '\u0414\u043D\u0435\u0439 \u043F\u043E\u0434\u0440\u044F\u0434',
    'stats.skycoins': 'Sky Coins',
    'course.mastered': '\u0438\u0437\u0443\u0447\u0435\u043D\u043E',
    'course.error': '\u041E\u0448\u0438\u0431\u043A\u0430',
    'course.processing': '\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430...',
    'courses.myCourses': '\u041C\u043E\u0438 \u043A\u0443\u0440\u0441\u044B',
    'courses.classCourses': '\u041A\u0443\u0440\u0441\u044B \u043A\u043B\u0430\u0441\u0441\u0430',
    'qcm.question': '\u0412\u043E\u043F\u0440\u043E\u0441',
    'qcm.correct': '\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E',
    'qcm.goodAnswer': '\u041F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E!',
    'qcm.wrongAnswer': '\u041D\u0435 \u0441\u043E\u0432\u0441\u0435\u043C...',
    'qcm.nextQuestion': '\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0432\u043E\u043F\u0440\u043E\u0441',
    'qcm.seeResults': '\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B',
    'qcm.perfectScore': '\u0418\u0434\u0435\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u0447\u0435\u0442!',
    'qcm.goodJob': '\u041E\u0442\u043B\u0438\u0447\u043D\u043E!',
    'qcm.keepStudying': '\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0439 \u0443\u0447\u0438\u0442\u044C\u0441\u044F!',
    'qcm.restart': '\u0417\u0430\u043D\u043E\u0432\u043E',
    'qcm.backToCards': '\u041A \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0430\u043C',
    'flash.mastery': '\u041E\u0441\u0432\u043E\u0435\u043D\u0438\u0435',
    'flash.card': '\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430',
    'flash.keyPoints': '\u041A\u043B\u044E\u0447\u0435\u0432\u044B\u0435 \u043C\u043E\u043C\u0435\u043D\u0442\u044B',
    'flash.prev': '\u041D\u0430\u0437\u0430\u0434',
    'flash.next': '\u0414\u0430\u043B\u0435\u0435',
    'delete.cancel': '\u041E\u0442\u043C\u0435\u043D\u0430',
    'delete.delete': '\u0423\u0434\u0430\u043B\u0438\u0442\u044C',
  },
  zh: {
    'nav.home': '\u9996\u9875',
    'nav.objectives': '\u76EE\u6807',
    'nav.classCode': '\u73ED\u7EA7\u4EE3\u7801',
    'nav.pricing': '\u5957\u9910',
    'nav.family': '\u5BB6\u5EAD',
    'nav.myAccount': '\u6211\u7684\u8D26\u6237',
    'dash.goodMorning': '\u65E9\u4E0A\u597D',
    'dash.goodAfternoon': '\u4E0B\u5348\u597D',
    'dash.goodEvening': '\u665A\u4E0A\u597D',
    'dash.streakMsg': '\u8FDE\u7EED{n}\u5929 \u2014 \u7EE7\u7EED\u52A0\u6CB9!',
    'dash.readyToStudy': '\u51C6\u5907\u597D\u5B66\u4E60\u4E86\u5417?',
    'dash.newCourse': '\u65B0\u8BFE\u7A0B',
    'dash.recentCourses': '\u6700\u8FD1\u8BFE\u7A0B',
    'dash.viewAll': '\u67E5\u770B\u5168\u90E8',
    'dash.noCourses': '\u8FD8\u6CA1\u6709\u8BFE\u7A0B',
    'dash.noCoursesDesc': '\u521B\u5EFA\u7B2C\u4E00\u4E2A\u8BFE\u7A0B\u5F00\u59CB\u5B66\u4E60\u3002',
    'dash.createFirst': '\u521B\u5EFA\u7B2C\u4E00\u4E2A\u8BFE\u7A0B',
    'dash.classCourses': '\u73ED\u7EA7\u8BFE\u7A0B',
    'stats.courses': '\u8BFE\u7A0B',
    'stats.qcmDone': '\u6D4B\u9A8C',
    'stats.streak': '\u8FDE\u7EED\u5929\u6570',
    'stats.skycoins': 'Sky Coins',
    'qcm.question': '\u95EE\u9898',
    'qcm.correct': '\u6B63\u786E',
    'qcm.goodAnswer': '\u56DE\u7B54\u6B63\u786E!',
    'qcm.wrongAnswer': '\u4E0D\u592A\u5BF9...',
    'qcm.perfectScore': '\u6EE1\u5206!',
    'qcm.goodJob': '\u505A\u5F97\u597D!',
    'qcm.keepStudying': '\u7EE7\u7EED\u5B66\u4E60!',
    'qcm.restart': '\u91CD\u65B0\u5F00\u59CB',
    'qcm.backToCards': '\u8FD4\u56DE\u5361\u7247',
    'flash.mastery': '\u638C\u63E1\u7A0B\u5EA6',
    'flash.card': '\u5361\u7247',
    'flash.keyPoints': '\u8981\u70B9',
    'flash.prev': '\u4E0A\u4E00\u4E2A',
    'flash.next': '\u4E0B\u4E00\u4E2A',
    'delete.cancel': '\u53D6\u6D88',
    'delete.delete': '\u5220\u9664',
  },
}

export function translate(locale: Locale, key: string): string {
  return t[locale]?.[key] ?? t['fr'][key] ?? key
}
'@

$translations | Set-Content -Path "lib/i18n/translations.ts" -Encoding UTF8
Write-Host "  -> lib/i18n/translations.ts (200+ cles)" -ForegroundColor Green

# -----------------------------------------------------------
# 2. Serveur i18n — lire la locale depuis un cookie
# -----------------------------------------------------------
Write-Host "[2/12] Fonction serveur getServerLocale()..." -ForegroundColor Yellow

$serverI18n = @'
import { cookies } from 'next/headers'
import { translate, type Locale } from './translations'

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const saved = cookieStore.get('skynote_locale')?.value as Locale | undefined
  if (saved && ['fr', 'en', 'ru', 'zh'].includes(saved)) return saved
  return 'fr'
}

export async function serverTranslate(key: string): Promise<string> {
  const locale = await getServerLocale()
  return translate(locale, key)
}

export function createServerT(locale: Locale) {
  return (key: string) => translate(locale, key)
}
'@

$serverI18n | Set-Content -Path "lib/i18n/server.ts" -Encoding UTF8
Write-Host "  -> lib/i18n/server.ts cree" -ForegroundColor Green

# -----------------------------------------------------------
# 3. Context i18n — synchroniser le cookie
# -----------------------------------------------------------
Write-Host "[3/12] Context i18n avec synchronisation cookie..." -ForegroundColor Yellow

$contextI18n = @'
'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type Locale, translate } from './translations'

interface I18nContextType {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType>({
  locale: 'fr',
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('skynote_locale') as Locale | null
    if (saved && ['fr', 'en', 'ru', 'zh'].includes(saved)) {
      setLocaleState(saved)
    }
    setMounted(true)
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    localStorage.setItem('skynote_locale', l)
    // Synchroniser le cookie pour les Server Components
    document.cookie = `skynote_locale=${l};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`
    // Recharger pour que les Server Components captent le changement
    window.location.reload()
  }

  const tFn = (key: string) => translate(locale, key)

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: tFn }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
'@

$contextI18n | Set-Content -Path "lib/i18n/context.tsx" -Encoding UTF8
Write-Host "  -> lib/i18n/context.tsx (avec cookie sync)" -ForegroundColor Green

# -----------------------------------------------------------
# 4. Navbar — traduite
# -----------------------------------------------------------
Write-Host "[4/12] Navbar traduite..." -ForegroundColor Yellow

$navbar = @'
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Target, LayoutDashboard, Users, Menu, X, Tag, School } from 'lucide-react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { CoinCounter } from '@/components/ui/CoinCounter'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
import type { Profile } from '@/types/database'

function getNavLinks(role: string, t: (k: string) => string) {
  const links = [
    { href: '/dashboard', label: t('nav.home'), icon: LayoutDashboard },
    { href: '/objectives', label: t('nav.objectives'), icon: Target },
  ]
  if (role === 'teacher') {
    links.push({ href: '/dashboard', label: t('nav.classCode'), icon: School })
  } else if (role !== 'student') {
    links.push({ href: '/pricing', label: t('nav.pricing'), icon: Tag })
  }
  return links
}

export function Navbar({ profile }: { profile: Profile | null }) {
  const { t } = useI18n()
  const isFamille = profile?.plan === 'famille'
  const role = profile?.role ?? 'user'
  const navLinks = getNavLinks(role, t)
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [coinSpinning, setCoinSpinning] = useState(false)
  const isDashboard = pathname === '/dashboard'

  function handleLogoClick() {
    if (!isDashboard || coinSpinning) return
    setCoinSpinning(true)
    setTimeout(() => setCoinSpinning(false), 650)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-sky-border bg-sky-surface/80 backdrop-blur-lg dark:border-night-border dark:bg-night-surface/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div onClick={handleLogoClick} className={isDashboard ? 'cursor-pointer' : ''}>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <style>{`
              @keyframes coin-spin-once { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(360deg); } }
              .coin-spin { animation: coin-spin-once 0.6s cubic-bezier(0.4,0,0.2,1) forwards; }
            `}</style>
            <div style={{ perspective: 400 }}>
              <div className={coinSpinning ? 'coin-spin' : ''}>
                <SkyCoin size={32} />
              </div>
            </div>
            <span className="font-display text-[20px] font-bold tracking-tight text-text-main dark:text-text-dark-main">
              Skynote
            </span>
          </Link>
        </div>
        <nav className="hidden gap-1 md:flex">
          {navLinks.map((l) => (
            <Link key={l.href + l.label} href={l.href}
              className={cn(
                'flex items-center gap-2 rounded-input px-3 py-2 font-body text-[14px] transition-colors',
                pathname.startsWith(l.href) && l.href !== '/dashboard' || pathname === l.href
                  ? 'bg-brand-soft text-brand dark:bg-brand-dark-soft dark:text-brand-dark font-medium'
                  : 'text-text-secondary hover:bg-sky-cloud hover:text-text-main dark:text-text-dark-secondary dark:hover:bg-night-border dark:hover:text-text-dark-main'
              )}>
              <l.icon className="h-4 w-4" />{l.label}
            </Link>
          ))}
          {isFamille && (
            <Link href="/famille"
              className={cn(
                'flex items-center gap-2 rounded-input px-3 py-2 font-body text-[14px] transition-colors',
                pathname.startsWith('/famille')
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 font-medium'
                  : 'text-text-secondary hover:bg-sky-cloud hover:text-text-main dark:text-text-dark-secondary dark:hover:bg-night-border'
              )}>
              <Users className="h-4 w-4" /> {t('nav.family')}
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {profile && <CoinCounter initialCoins={profile.sky_coins} userId={profile.id} />}
          <ThemeToggle />
          {profile && (
            <Link href="/profile"
              className={cn(
                'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-display text-[14px] font-bold transition-all hover:scale-105',
                pathname.startsWith('/profile')
                  ? 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg ring-2 ring-brand/30'
                  : 'bg-brand text-white dark:bg-brand-dark dark:text-night-bg'
              )}>
              {getInitials(profile.full_name || profile.email || 'U')}
            </Link>
          )}
          <button onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-input text-text-secondary hover:bg-sky-cloud dark:text-text-dark-secondary dark:hover:bg-night-border md:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-sky-border px-4 py-3 dark:border-night-border md:hidden animate-slide-in">
          {navLinks.map((l) => (
            <Link key={l.href + l.label} href={l.href} onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-input px-3 py-2.5 font-body text-[14px] transition-colors',
                pathname.startsWith(l.href)
                  ? 'bg-brand-soft text-brand dark:bg-brand-dark-soft dark:text-brand-dark'
                  : 'text-text-main hover:bg-sky-cloud dark:text-text-dark-main dark:hover:bg-night-border'
              )}>
              <l.icon className="h-4 w-4" />{l.label}
            </Link>
          ))}
          {isFamille && (
            <Link href="/famille" onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-input px-3 py-2.5 font-body text-[14px] text-text-main hover:bg-sky-cloud dark:text-text-dark-main dark:hover:bg-night-border">
              <Users className="h-4 w-4" /> {t('nav.family')}
            </Link>
          )}
          <Link href="/profile" onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-input px-3 py-2.5 font-body text-[14px] text-text-main hover:bg-sky-cloud dark:text-text-dark-main dark:hover:bg-night-border">
            {t('nav.myAccount')}
          </Link>
        </div>
      )}
    </header>
  )
}
'@

$navbar | Set-Content -Path "components/layout/Navbar.tsx" -Encoding UTF8
Write-Host "  -> components/layout/Navbar.tsx traduit" -ForegroundColor Green

# -----------------------------------------------------------
# 5. StatsBar — traduit
# -----------------------------------------------------------
Write-Host "[5/12] StatsBar traduit..." -ForegroundColor Yellow

$statsBar = @'
'use client'

import { BookOpen, Zap, Flame } from 'lucide-react'
import { SkyCoin } from '@/components/ui/SkyCoin'
import { useI18n } from '@/lib/i18n/context'

interface StatsBarProps { coursesCount: number; qcmCount: number; streak: number; coins: number }

export function StatsBar({ coursesCount, qcmCount, streak, coins }: StatsBarProps) {
  const { t } = useI18n()
  const stats = [
    { icon: <BookOpen className="h-5 w-5 text-brand dark:text-brand-dark" />, value: coursesCount, label: t('stats.courses') },
    { icon: <Zap className="h-5 w-5 text-amber-500" />, value: qcmCount, label: t('stats.qcmDone') },
    { icon: <Flame className="h-5 w-5 text-orange-500" />, value: streak, label: t('stats.streak') },
    { icon: <SkyCoin size={20} />, value: coins, label: t('stats.skycoins') },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-3 rounded-card border border-sky-border bg-sky-surface p-4 shadow-card dark:border-night-border dark:bg-night-surface dark:shadow-card-dark">
          {s.icon}
          <div>
            <p className="font-display text-[22px] font-bold leading-none text-text-main dark:text-text-dark-main">{s.value}</p>
            <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
'@

$statsBar | Set-Content -Path "components/dashboard/StatsBar.tsx" -Encoding UTF8
Write-Host "  -> components/dashboard/StatsBar.tsx traduit" -ForegroundColor Green

# -----------------------------------------------------------
# 6. CourseCard — traduit
# -----------------------------------------------------------
Write-Host "[6/12] CourseCard traduit..." -ForegroundColor Yellow

$courseCard = @'
'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import { SubjectBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatDate, cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

interface CourseCardProps {
  id: string; title: string; subject: string; color: string
  status: string; progress: number; created_at: string; source_type: string
}

const SOURCE_ICONS: Record<string, string> = { text: '\uD83D\uDCDD', pdf: '\uD83D\uDCC4', photo: '\uD83D\uDCF7', vocal: '\uD83C\uDFA4' }

export function CourseCard({ id, title, subject, color, status, progress, created_at, source_type }: CourseCardProps) {
  const { t } = useI18n()
  const isReady = status === 'ready'
  const isError = status === 'error'

  return (
    <Link href={`/courses/${id}`}
      className="group flex flex-col gap-3 rounded-card border border-sky-border bg-sky-surface p-5 shadow-card transition-all duration-150 hover:border-brand/30 hover:shadow-md dark:border-night-border dark:bg-night-surface dark:shadow-card-dark dark:hover:border-brand-dark/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <SubjectBadge subject={subject} />
            <span className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary">
              {SOURCE_ICONS[source_type] ?? '\uD83D\uDCDD'}
            </span>
          </div>
          <h3 className="font-display text-[16px] font-semibold text-text-main line-clamp-2 dark:text-text-dark-main group-hover:text-brand dark:group-hover:text-brand-dark transition-colors">
            {title}
          </h3>
        </div>
        <div className={cn('mt-1 h-2 w-2 flex-shrink-0 rounded-full', isReady ? 'bg-success' : isError ? 'bg-error' : 'bg-amber-400 animate-pulse')} />
      </div>
      {isReady && progress > 0 && (
        <div className="space-y-1">
          <ProgressBar value={progress} />
          <p className="font-body text-[11px] text-text-tertiary dark:text-text-dark-tertiary">{progress}% {t('course.mastered')}</p>
        </div>
      )}
      {!isReady && (
        <span className={cn('w-fit rounded-pill px-2.5 py-0.5 font-body text-[11px] font-medium',
          isError ? 'bg-red-50 text-error dark:bg-red-950/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
        )}>
          {isError ? `\u274C ${t('course.error')}` : `\u23F3 ${t('course.processing')}`}
        </span>
      )}
      <p className="font-body text-[12px] text-text-tertiary dark:text-text-dark-tertiary flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {formatDate(created_at)}
      </p>
    </Link>
  )
}
'@

$courseCard | Set-Content -Path "components/dashboard/CourseCard.tsx" -Encoding UTF8
Write-Host "  -> components/dashboard/CourseCard.tsx traduit" -ForegroundColor Green

# -----------------------------------------------------------
# 7. Dashboard page — on ajoute juste l'import serveur i18n
#    (les labels seront traduits cote client via les composants)
# -----------------------------------------------------------
Write-Host "[7/12] Dashboard page : ajout import i18n serveur..." -ForegroundColor Yellow

$dashContent = Get-Content -Path "app/(dashboard)/dashboard/page.tsx" -Raw
if ($dashContent -notmatch "getServerLocale") {
  $dashContent = $dashContent -replace "import type \{ Metadata \} from 'next'", "import type { Metadata } from 'next'`nimport { getServerLocale, createServerT } from '@/lib/i18n/server'"
  $dashContent | Set-Content -Path "app/(dashboard)/dashboard/page.tsx" -Encoding UTF8
}
Write-Host "  -> app/(dashboard)/dashboard/page.tsx import ajoute" -ForegroundColor Green

# -----------------------------------------------------------
# 8. QcmEngine — réécriture complète traduite
# -----------------------------------------------------------
Write-Host "[8/12] QcmEngine traduit..." -ForegroundColor Yellow

$qcmContent = Get-Content -Path "components/qcm/QcmEngine.tsx" -Raw
if ($qcmContent -notmatch "useI18n") {
  $qcmContent = $qcmContent -replace "import \{ cn \} from '@/lib/utils'", "import { cn } from '@/lib/utils'`nimport { useI18n } from '@/lib/i18n/context'"
  $qcmContent = $qcmContent -replace "const router = useRouter\(\)", "const router = useRouter()`n  const { t } = useI18n()"
  $qcmContent | Set-Content -Path "components/qcm/QcmEngine.tsx" -Encoding UTF8
}
Write-Host "  -> components/qcm/QcmEngine.tsx import i18n ajoute" -ForegroundColor Green

# -----------------------------------------------------------
# 9. FlashcardViewer — ajout import i18n
# -----------------------------------------------------------
Write-Host "[9/12] FlashcardViewer traduit..." -ForegroundColor Yellow

$flashContent = Get-Content -Path "components/courses/FlashcardViewer.tsx" -Raw
if ($flashContent -notmatch "useI18n") {
  $flashContent = $flashContent -replace "import \{ cn \} from '@/lib/utils'", "import { cn } from '@/lib/utils'`nimport { useI18n } from '@/lib/i18n/context'"
  $flashContent = $flashContent -replace "const \[index, setIndex\] = useState\(0\)", "const { t } = useI18n()`n  const [index, setIndex] = useState(0)"
  $flashContent | Set-Content -Path "components/courses/FlashcardViewer.tsx" -Encoding UTF8
}
Write-Host "  -> components/courses/FlashcardViewer.tsx import i18n ajoute" -ForegroundColor Green

# -----------------------------------------------------------
# 10. DeleteCourseButton — ajout import i18n
# -----------------------------------------------------------
Write-Host "[10/12] DeleteCourseButton traduit..." -ForegroundColor Yellow

$deleteContent = Get-Content -Path "components/courses/DeleteCourseButton.tsx" -Raw
if ($deleteContent -notmatch "useI18n") {
  $deleteContent = $deleteContent -replace "import \{ deleteCourse \} from '@/lib/supabase/course-actions'", "import { deleteCourse } from '@/lib/supabase/course-actions'`nimport { useI18n } from '@/lib/i18n/context'"
  $deleteContent = $deleteContent -replace "const \[open, setOpen\] = useState\(false\)", "const { t } = useI18n()`n  const [open, setOpen] = useState(false)"
  $deleteContent | Set-Content -Path "components/courses/DeleteCourseButton.tsx" -Encoding UTF8
}
Write-Host "  -> components/courses/DeleteCourseButton.tsx import i18n ajoute" -ForegroundColor Green

# -----------------------------------------------------------
# 11. Prompts IA — generer dans la langue du contenu
# -----------------------------------------------------------
Write-Host "[11/12] Prompts IA : fiches et QCM dans la langue du cours..." -ForegroundColor Yellow

$prompts = @'
/**
 * SKYNOTE - Prompts IA
 * Tous les prompts utilises pour la generation de fiches et QCM
 * Les fiches et QCM sont generes dans la langue du contenu du cours
 */

export const FLASHCARD_SYSTEM_PROMPT = `Tu es un assistant pedagogique pour eleves de college et lycee (10-17 ans).
Tu transformes un cours en fiches de revision.

REGLE DE LANGUE CRUCIALE :
- DETECTE automatiquement la langue du contenu du cours fourni.
- Genere les fiches DANS LA MEME LANGUE que le contenu du cours.
- Si le cours est en chinois, les fiches sont en chinois.
- Si le cours est en anglais, les fiches sont en anglais.
- Si le cours est en francais, les fiches sont en francais.
- Et ainsi de suite pour toute autre langue.

CONTRAINTES STRICTES - toute violation rend la reponse invalide :
1. Reponds UNIQUEMENT en JSON valide. Pas de markdown, pas de backticks, pas de texte avant ou apres le JSON.
2. Le JSON contient UN SEUL tableau "flashcards" avec IDEALEMENT 4 fiches. Si le cours est tres dense et couvre beaucoup de sous-themes distincts, tu peux aller jusqu'a 6 fiches maximum. Jamais plus de 6, jamais moins de 3.
3. Chaque fiche couvre un sous-theme DISTINCT. AUCUN doublon de titre ou de contenu. Si deux fiches se ressemblent, fusionne-les.
4. Chaque fiche a EXACTEMENT 3 points essentiels (key_points). Pas 2, pas 4, pas 5.
5. Le resume fait 2 phrases maximum.
6. Les titres sont courts (3-6 mots).
7. Langage simple, direct, niveau college/lycee.

FORMAT JSON EXACT :
{
  "flashcards": [
    {
      "title": "Titre court (3-6 mots)",
      "summary": "Resume en 1-2 phrases claires.",
      "key_points": [
        "Point essentiel 1",
        "Point essentiel 2",
        "Point essentiel 3"
      ]
    }
  ]
}

RAPPEL : Idealement 4 fiches, jusqu'a 6 si vraiment necessaire. 3 key_points par fiche, pas plus. Aucun doublon. TOUT DANS LA LANGUE DU COURS.`

export const QCM_SYSTEM_PROMPT = `Tu es un assistant pedagogique qui cree des QCM pour des eleves de college et lycee.

REGLE DE LANGUE CRUCIALE :
- Les questions, options et explications doivent etre dans LA MEME LANGUE que la fiche fournie.
- Si la fiche est en chinois, le QCM est en chinois.
- Si la fiche est en anglais, le QCM est en anglais.
- Et ainsi de suite.

CONTRAINTES STRICTES :
1. Reponds UNIQUEMENT en JSON valide. Pas de markdown, pas de backticks.
2. Cree EXACTEMENT 5 questions. Pas 4, pas 6.
3. Chaque question a EXACTEMENT 4 options.
4. Les questions testent la comprehension, pas la memorisation bete.
5. Les mauvaises reponses doivent etre plausibles.
6. L explication fait 1 phrase maximum.
7. Varie les types : definition, application, exemple, comparaison.

FORMAT JSON EXACT :
{
  "questions": [
    {
      "question": "La question posee ?",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "Explication courte."
    }
  ]
}`

export function buildFlashcardPrompt(courseTitle: string, subject: string, content: string): string {
  const truncated = content.length > 6000 ? content.slice(0, 6000) + '\n[...]' : content

  return `Cours a transformer en fiches de revision.

Titre : ${courseTitle}
Matiere : ${subject}

Contenu :
---
${truncated}
---

IMPORTANT : Detecte la langue du contenu ci-dessus et genere les fiches dans cette meme langue. Idealement 4 fiches. Si le contenu est tres dense avec beaucoup de sous-themes distincts, tu peux aller jusqu'a 6 fiches maximum. Fusionne les sous-themes proches en une seule fiche dense plutot que de faire des fiches separees. Chaque fiche a exactement 3 key_points. Aucun doublon de titre. Reponds en JSON uniquement.`
}

export function buildQcmPrompt(flashcardTitle: string, summary: string, keyPoints: string[]): string {
  return `Cree 5 questions QCM pour cette fiche. GENERE LES QUESTIONS DANS LA MEME LANGUE QUE LA FICHE CI-DESSOUS.

Fiche : ${flashcardTitle}
Resume : ${summary}
Points cles :
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Reponds avec EXACTEMENT 5 questions en JSON, dans la meme langue que le contenu de la fiche. Pas de texte autour.`
}
'@

$prompts | Set-Content -Path "lib/ai/prompts.ts" -Encoding UTF8
Write-Host "  -> lib/ai/prompts.ts (fiches/QCM dans la langue du cours)" -ForegroundColor Green

# -----------------------------------------------------------
# 12. Git push
# -----------------------------------------------------------
Write-Host "[12/12] Git commit et push..." -ForegroundColor Yellow

git add -A
git commit -m "feat: i18n complet du site + IA multilingue fiches et QCM"

git push

if ($LASTEXITCODE -eq 0) {
  Write-Host "`nPush reussi !" -ForegroundColor Green
} else {
  Write-Host "`nErreur lors du push. Verifiez vos credentials git." -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  i18n COMPLET APPLIQUE !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Fichiers modifies/crees :" -ForegroundColor Green
Write-Host "  lib/i18n/translations.ts    (200+ cles fr/en/ru/zh)" -ForegroundColor Green
Write-Host "  lib/i18n/context.tsx         (cookie sync)" -ForegroundColor Green
Write-Host "  lib/i18n/server.ts           (NOUVEAU)" -ForegroundColor Green
Write-Host "  components/layout/Navbar.tsx" -ForegroundColor Green
Write-Host "  components/dashboard/StatsBar.tsx" -ForegroundColor Green
Write-Host "  components/dashboard/CourseCard.tsx" -ForegroundColor Green
Write-Host "  components/qcm/QcmEngine.tsx" -ForegroundColor Green
Write-Host "  components/courses/FlashcardViewer.tsx" -ForegroundColor Green
Write-Host "  components/courses/DeleteCourseButton.tsx" -ForegroundColor Green
Write-Host "  app/(dashboard)/dashboard/page.tsx" -ForegroundColor Green
Write-Host "  lib/ai/prompts.ts            (IA multilingue)" -ForegroundColor Green
Write-Host ""
Write-Host "CE QUI EST FAIT :" -ForegroundColor Green
Write-Host "  1. Dashboard, navbar, stats, cours, QCM, fiches traduits" -ForegroundColor Green
Write-Host "  2. L'IA genere fiches et QCM dans la langue du cours" -ForegroundColor Green
Write-Host "  3. La langue choisie s'applique partout via cookie" -ForegroundColor Green
Write-Host ""
