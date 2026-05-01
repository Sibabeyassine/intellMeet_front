import type { Channel, ChatMessage, Meeting, Notification, Project, Task, Team, User } from "../types";

export const COLORS = {
  blue: "221 83% 53%",
  green: "152 70% 45%",
  amber: "38 92% 55%",
  pink: "330 75% 55%",
  purple: "265 70% 60%",
  cyan: "190 80% 45%",
};

const isoDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString();
const isoMin  = (m: number) => new Date(Date.now() + m * 60000).toISOString();

export const seedUser: User = {
  id: "u_you",
  email: "valentin@intellmeet.app",
  fullName: "Valentin Bertrand",
  initials: "VB",
  color: COLORS.green,
  role: "owner",
  createdAt: new Date().toISOString(),
};

// ---------- TEAMS ----------
export const seedTeams: Team[] = [
  { id: "team_product",     name: "Product",     color: COLORS.blue,   memberCount: 8, createdAt: new Date().toISOString() },
  { id: "team_engineering", name: "Engineering", color: COLORS.green,  memberCount: 12, createdAt: new Date().toISOString() },
  { id: "team_design",      name: "Design",      color: COLORS.pink,   memberCount: 5, createdAt: new Date().toISOString() },
  { id: "team_marketing",   name: "Marketing",   color: COLORS.amber,  memberCount: 4, createdAt: new Date().toISOString() },
];

// ---------- PROJECTS ----------
export const seedProjects: Project[] = [
  { id: "proj_q2_roadmap",   teamId: "team_product",     name: "Q2 Roadmap",          key: "Q2",  color: COLORS.blue,   description: "Quarterly product roadmap", createdAt: new Date().toISOString() },
  { id: "proj_onboarding",   teamId: "team_design",      name: "Onboarding v2",       key: "ONB", color: COLORS.pink,   description: "Redesigned signup flow",   createdAt: new Date().toISOString() },
  { id: "proj_stripe",       teamId: "team_engineering", name: "Stripe Integration",  key: "PAY", color: COLORS.green,  description: "Billing & subscriptions",  createdAt: new Date().toISOString() },
  { id: "proj_launch",       teamId: "team_marketing",   name: "v2 Launch Campaign",  key: "GTM", color: COLORS.amber,  description: "Go-to-market plan",        createdAt: new Date().toISOString() },
];

// ---------- MEETINGS ----------
export const seedMeetings: Meeting[] = [
  {
    id: "m_live",
    title: "Product sync — Q2 Roadmap",
    description: "Weekly product sync",
    scheduledAt: new Date().toISOString(),
    durationMin: 30,
    status: "live",
    hostId: "u_lea",
    inviteUrl: "intellmeet.app/r/q2-sync",
    hasAISummary: true,
    participants: [
      { id: "u_lea",   name: "Lea Moreau",     initials: "LM", color: COLORS.blue,   isHost: true, isCameraOn: true, isSpeaking: true },
      { id: "u_you",   name: "You",            initials: "VB", color: COLORS.green,  isYou: true, isCameraOn: false, isMuted: false },
      { id: "u_marc",  name: "Marc Dubois",    initials: "MD", color: COLORS.amber,  isCameraOn: true, isMuted: true },
      { id: "u_sofia", name: "Sofia Rinaldi",  initials: "SR", color: COLORS.pink,   isCameraOn: true },
      { id: "u_kenji", name: "Kenji Tanaka",   initials: "KT", color: COLORS.purple, isCameraOn: false, isMuted: true },
      { id: "u_amira", name: "Amira Haddad",   initials: "AH", color: COLORS.cyan,   isCameraOn: true },
    ],
  },
  {
    id: "m_design",
    title: "Design review — Onboarding v2",
    scheduledAt: isoMin(90),
    durationMin: 45,
    status: "scheduled",
    hostId: "u_sofia",
    inviteUrl: "intellmeet.app/r/onb-v2",
    participants: [
      { id: "u_sofia", name: "Sofia Rinaldi", initials: "SR", color: COLORS.pink, isHost: true },
      { id: "u_you",   name: "You",           initials: "VB", color: COLORS.green, isYou: true },
      { id: "u_lea",   name: "Lea Moreau",    initials: "LM", color: COLORS.blue },
      { id: "u_amira", name: "Amira Haddad",  initials: "AH", color: COLORS.cyan },
    ],
  },
  {
    id: "m_hiring",
    title: "Hiring sync — Engineering",
    scheduledAt: isoDays(-1),
    durationMin: 60,
    status: "ended",
    hostId: "u_you",
    inviteUrl: "intellmeet.app/r/hiring",
    hasAISummary: true,
    participants: [
      { id: "u_you",  name: "You",         initials: "VB", color: COLORS.green, isYou: true, isHost: true },
      { id: "u_lea",  name: "Lea Moreau",  initials: "LM", color: COLORS.blue },
      { id: "u_marc", name: "Marc Dubois", initials: "MD", color: COLORS.amber },
    ],
  },
  {
    id: "m_allhands",
    title: "Weekly all-hands",
    scheduledAt: isoDays(-7),
    durationMin: 60,
    status: "ended",
    hostId: "u_lea",
    inviteUrl: "intellmeet.app/r/all",
    hasAISummary: true,
    participants: [
      { id: "u_lea",   name: "Lea Moreau",    initials: "LM", color: COLORS.blue, isHost: true },
      { id: "u_you",   name: "You",           initials: "VB", color: COLORS.green, isYou: true },
      { id: "u_marc",  name: "Marc Dubois",   initials: "MD", color: COLORS.amber },
      { id: "u_sofia", name: "Sofia Rinaldi", initials: "SR", color: COLORS.pink },
    ],
  },
];

// ---------- TASKS (tied to projects) ----------
const today = new Date();
const dayOf = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return d.toISOString(); };

export const seedTasks: Task[] = [
  // Stripe project
  { id: "t1",  projectId: "proj_stripe",     title: "Finalize Stripe integration",       description: "API keys + webhook + E2E tests", status: "in_progress", priority: "high", assignees: [{ initials: "MD", color: COLORS.amber }], dueDate: dayOf(2),  comments: 4, fromAI: true, tag: { label: "Backend",  color: COLORS.green }, createdAt: dayOf(-3), updatedAt: dayOf(-1) },
  { id: "t9",  projectId: "proj_stripe",     title: "Set up Sentry monitoring in prod",  status: "todo",        priority: "high", assignees: [{ initials: "MD", color: COLORS.amber }], dueDate: dayOf(4),  tag: { label: "Backend",  color: COLORS.green }, createdAt: dayOf(-2), updatedAt: dayOf(-2) },
  { id: "t11", projectId: "proj_stripe",     title: "Write subscription webhook tests",  status: "review",      priority: "med",  assignees: [{ initials: "AH", color: COLORS.cyan }],   dueDate: dayOf(1),  comments: 2, tag: { label: "QA",       color: COLORS.cyan },  createdAt: dayOf(-4), updatedAt: dayOf(0) },

  // Onboarding project
  { id: "t2",  projectId: "proj_onboarding", title: "Push onboarding mockups to Figma",  status: "todo",        priority: "high", assignees: [{ initials: "SR", color: COLORS.pink }],   dueDate: dayOf(0),  attachments: 3, fromAI: true, tag: { label: "Design", color: COLORS.pink },  createdAt: dayOf(-1), updatedAt: dayOf(0) },
  { id: "t6",  projectId: "proj_onboarding", title: "Audit dashboard performance",       status: "review",      priority: "low",  assignees: [{ initials: "KT", color: COLORS.purple }], dueDate: dayOf(5),  comments: 2, tag: { label: "Frontend", color: COLORS.blue },                createdAt: dayOf(-5), updatedAt: dayOf(-1) },
  { id: "t12", projectId: "proj_onboarding", title: "Implement empty states",            status: "in_progress", priority: "med",  assignees: [{ initials: "SR", color: COLORS.pink }],   dueDate: dayOf(3),               tag: { label: "Frontend", color: COLORS.blue },               createdAt: dayOf(-2), updatedAt: dayOf(0) },

  // Q2 roadmap
  { id: "t3",  projectId: "proj_q2_roadmap", title: "Write partner API documentation",   status: "todo",        priority: "med",  assignees: [{ initials: "AH", color: COLORS.cyan }],   dueDate: dayOf(4),  fromAI: true, tag: { label: "Docs",     color: COLORS.blue }, createdAt: dayOf(-2), updatedAt: dayOf(-1) },
  { id: "t4",  projectId: "proj_q2_roadmap", title: "Block internal review (Thu 3pm)",   status: "done",        priority: "med",  assignees: [{ initials: "LM", color: COLORS.blue }],   dueDate: dayOf(-1), fromAI: true,                                                createdAt: dayOf(-7), updatedAt: dayOf(-1) },
  { id: "t5",  projectId: "proj_q2_roadmap", title: "Recruit Senior Backend Engineer",   status: "in_progress", priority: "med",  assignees: [{ initials: "VB", color: COLORS.green }, { initials: "LM", color: COLORS.blue }], dueDate: dayOf(20), comments: 12, tag: { label: "Hiring", color: COLORS.purple }, createdAt: dayOf(-10), updatedAt: dayOf(-2) },
  { id: "t7",  projectId: "proj_q2_roadmap", title: "Prepare board meeting slides",      status: "backlog",     priority: "med",  assignees: [{ initials: "LM", color: COLORS.blue }],   dueDate: dayOf(7),  attachments: 1,                                                createdAt: dayOf(-3), updatedAt: dayOf(-3) },

  // Launch
  { id: "t8",  projectId: "proj_launch",     title: "Redesign pricing page",             status: "backlog",     priority: "low",  assignees: [{ initials: "SR", color: COLORS.pink }],                tag: { label: "Marketing", color: COLORS.amber },                createdAt: dayOf(-4), updatedAt: dayOf(-4) },
  { id: "t10", projectId: "proj_launch",     title: "Write v2 launch blog post",         status: "review",      priority: "low",  assignees: [{ initials: "AH", color: COLORS.cyan }],   dueDate: dayOf(6),  comments: 5, tag: { label: "Marketing", color: COLORS.amber }, createdAt: dayOf(-5), updatedAt: dayOf(-1) },
  { id: "t13", projectId: "proj_launch",     title: "Schedule press demos",              status: "todo",        priority: "high", assignees: [{ initials: "AH", color: COLORS.cyan }],   dueDate: dayOf(8),               tag: { label: "PR",        color: COLORS.purple }, createdAt: dayOf(-1), updatedAt: dayOf(-1) },
];

// ---------- CHAT ----------
export const seedChannels: Channel[] = [
  { id: "general",     name: "general",     kind: "channel", unread: 2, topic: "Company-wide announcements" },
  { id: "product",     name: "product",     kind: "channel", topic: "Product sync & roadmap" },
  { id: "design",      name: "design",      kind: "channel", topic: "Design system & reviews" },
  { id: "engineering", name: "engineering", kind: "channel", unread: 5, topic: "Backend & frontend" },
  { id: "random",      name: "random",      kind: "channel", topic: "Off-topic" },
];

export const seedDMs: Channel[] = [
  { id: "dm_lea",   name: "Lea Moreau",     kind: "dm", online: true,  color: COLORS.blue,   initials: "LM", unread: 1 },
  { id: "dm_marc",  name: "Marc Dubois",    kind: "dm", online: true,  color: COLORS.amber,  initials: "MD" },
  { id: "dm_sofia", name: "Sofia Rinaldi",  kind: "dm", online: false, color: COLORS.pink,   initials: "SR", lastSeen: "1h ago" },
  { id: "dm_amira", name: "Amira Haddad",   kind: "dm", online: true,  color: COLORS.cyan,   initials: "AH" },
  { id: "dm_kenji", name: "Kenji Tanaka",   kind: "dm", online: false, color: COLORS.purple, initials: "KT", lastSeen: "yesterday" },
];

export const seedMessages: Record<string, ChatMessage[]> = {
  general: [
    { id: "g1", channelId: "general", authorId: "u_lea", authorName: "Lea Moreau", initials: "LM", color: COLORS.blue, time: "09:42", text: "Hey team 👋 product sync in 15 min?", createdAt: new Date().toISOString() },
  ],
  product: [
    { id: "p1", channelId: "product", authorId: "u_lea",  authorName: "Lea Moreau",    initials: "LM", color: COLORS.blue,   time: "09:42", text: "Anyone has the latest Stripe numbers?", createdAt: new Date().toISOString() },
    { id: "p2", channelId: "product", authorId: "u_marc", authorName: "Marc Dubois",   initials: "MD", color: COLORS.amber,  time: "09:43", text: "Yes, I'll bring them to the sync", reactions: [{ emoji: "🔥", count: 3 }], createdAt: new Date().toISOString() },
    { id: "p3", channelId: "product", authorId: "u_sofia", authorName: "Sofia Rinaldi", initials: "SR", color: COLORS.pink,   time: "09:48", text: "Sharing onboarding mockups right before", createdAt: new Date().toISOString() },
    { id: "p4", channelId: "product", authorId: "u_ai",   authorName: "IntellMeet AI", initials: "AI", color: COLORS.purple, time: "09:55", text: "Last sync recap: 4 action items, Stripe integration is top priority. Click to expand.", ai: true, createdAt: new Date().toISOString() },
  ],
  design: [
    { id: "d1", channelId: "design", authorId: "u_sofia", authorName: "Sofia Rinaldi", initials: "SR", color: COLORS.pink, time: "08:30", text: "New Card v2 component merged 🎉", reactions: [{ emoji: "🎉", count: 5 }], createdAt: new Date().toISOString() },
  ],
  engineering: [
    { id: "e1", channelId: "engineering", authorId: "u_marc", authorName: "Marc Dubois", initials: "MD", color: COLORS.amber, time: "10:12", text: "Stripe webhook PR is ready for review: github.com/intellmeet/api/pull/482", createdAt: new Date().toISOString() },
  ],
  random: [],
  dm_lea:   [{ id: "dl1", channelId: "dm_lea", authorId: "u_lea", authorName: "Lea Moreau", initials: "LM", color: COLORS.blue, time: "09:30", text: "Can you share the Q2 doc please?", createdAt: new Date().toISOString() }],
  dm_marc: [], dm_sofia: [], dm_amira: [], dm_kenji: [],
};

export const seedNotifications: Notification[] = [
  { id: "n1", title: "New action item",   body: "Lea assigned you 'Prepare board meeting slides'", read: false, createdAt: new Date().toISOString(), kind: "task",    href: "/projects" },
  { id: "n2", title: "Sync starts in 5m", body: "Q2 Roadmap — 6 participants",                     read: false, createdAt: new Date().toISOString(), kind: "meeting", href: "/meeting" },
  { id: "n3", title: "AI summary ready",  body: "Hiring sync — 6 decisions, 4 actions",            read: true,  createdAt: new Date().toISOString(), kind: "ai",      href: "/meetings" },
];
