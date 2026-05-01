export type Participant = {
  id: string;
  name: string;
  initials: string;
  color: string; // hsl
  isSpeaking?: boolean;
  isMuted?: boolean;
  isCameraOn?: boolean;
  isHost?: boolean;
  isYou?: boolean;
  isScreenSharing?: boolean;
};

export const mockParticipants: Participant[] = [
  { id: "1", name: "Léa Moreau", initials: "LM", color: "221 83% 53%", isSpeaking: true, isCameraOn: true, isHost: true },
  { id: "2", name: "Toi", initials: "VB", color: "152 70% 45%", isCameraOn: false, isMuted: false, isYou: true },
  { id: "3", name: "Marc Dubois", initials: "MD", color: "38 92% 55%", isCameraOn: true, isMuted: true },
  { id: "4", name: "Sofia Rinaldi", initials: "SR", color: "330 75% 55%", isCameraOn: true },
  { id: "5", name: "Kenji Tanaka", initials: "KT", color: "265 70% 60%", isCameraOn: false, isMuted: true },
  { id: "6", name: "Amira Haddad", initials: "AH", color: "190 80% 45%", isCameraOn: true },
];

export type ChatMessage = {
  id: string;
  authorId: string;
  authorName: string;
  initials: string;
  color: string;
  time: string;
  text: string;
  isYou?: boolean;
};

export const mockMessages: ChatMessage[] = [
  { id: "m1", authorId: "1", authorName: "Léa Moreau", initials: "LM", color: "221 83% 53%", time: "10:02", text: "Bienvenue à tous 👋 On commence dans 1 min." },
  { id: "m2", authorId: "3", authorName: "Marc Dubois", initials: "MD", color: "38 92% 55%", time: "10:03", text: "J'ai partagé le doc Q2 dans les notes." },
  { id: "m3", authorId: "4", authorName: "Sofia Rinaldi", initials: "SR", color: "330 75% 55%", time: "10:05", text: "Top, je peux présenter mes mockups après ?" },
  { id: "m4", authorId: "2", authorName: "Toi", initials: "VB", color: "152 70% 45%", time: "10:06", text: "Parfait pour moi 🚀", isYou: true },
  { id: "m5", authorId: "6", authorName: "Amira Haddad", initials: "AH", color: "190 80% 45%", time: "10:07", text: "Je prends les notes de ce sprint." },
];

export type TranscriptLine = {
  id: string;
  authorName: string;
  initials: string;
  color: string;
  time: string;
  text: string;
};

export const mockTranscript: TranscriptLine[] = [
  { id: "t1", authorName: "Léa Moreau", initials: "LM", color: "221 83% 53%", time: "00:14", text: "Objectif aujourd'hui : valider la roadmap Q2 et clore les blocants côté design." },
  { id: "t2", authorName: "Marc Dubois", initials: "MD", color: "38 92% 55%", time: "00:42", text: "On a un retard sur l'intégration Stripe — il faut prioriser cette semaine." },
  { id: "t3", authorName: "Sofia Rinaldi", initials: "SR", color: "330 75% 55%", time: "01:18", text: "Les nouveaux mockups onboarding sont prêts, je les pousse sur Figma après le call." },
  { id: "t4", authorName: "Amira Haddad", initials: "AH", color: "190 80% 45%", time: "01:55", text: "Je m'occupe de la doc API pour les partenaires d'ici vendredi." },
  { id: "t5", authorName: "Léa Moreau", initials: "LM", color: "221 83% 53%", time: "02:20", text: "Parfait. On bloque jeudi 15h pour la review interne." },
];

export type ActionItem = {
  id: string;
  title: string;
  assignee: string;
  initials: string;
  color: string;
  due: string;
  status: "todo" | "in_progress" | "done";
};

export const mockActions: ActionItem[] = [
  { id: "a1", title: "Finaliser intégration Stripe", assignee: "Marc Dubois", initials: "MD", color: "38 92% 55%", due: "Ven. 26 avril", status: "in_progress" },
  { id: "a2", title: "Pousser mockups onboarding sur Figma", assignee: "Sofia Rinaldi", initials: "SR", color: "330 75% 55%", due: "Aujourd'hui", status: "todo" },
  { id: "a3", title: "Rédiger doc API partenaires", assignee: "Amira Haddad", initials: "AH", color: "190 80% 45%", due: "Ven. 26 avril", status: "todo" },
  { id: "a4", title: "Bloquer review interne (jeudi 15h)", assignee: "Léa Moreau", initials: "LM", color: "221 83% 53%", due: "Jeu. 25 avril", status: "done" },
];

export const mockSummary = {
  topic: "Roadmap Q2 — Sync produit hebdo",
  highlights: [
    "Objectif : valider la roadmap Q2 et débloquer les sujets design.",
    "Intégration Stripe en retard — priorité haute cette semaine.",
    "Nouveaux mockups onboarding prêts à être partagés.",
    "Documentation API partenaires à livrer vendredi.",
  ],
  decisions: [
    "Review interne planifiée jeudi 15h.",
    "Sofia présente les mockups en fin de réunion.",
  ],
};
