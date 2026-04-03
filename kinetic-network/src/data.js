// Cooldown duration for demo — short enough to observe expire live.
// In production this would be 30 days.
export const COOLDOWN_MS = 20 * 1000;

// Patient pool.
//
// Each patient has three ownership/location fields:
//   originClinicId     — the clinic that owns the record; only they can grant/revoke consent
//   activeAtClinicIds  — all clinics where the patient is currently being treated
//   referredToClinicId — set if formally referred to a specific clinic; implies pre-consent for that clinic
//
// Classification from any clinic's perspective (see classify.js):
//   yours          → originClinicId === clinic.id
//   referred       → referredToClinicId === clinic.id
//   seen_elsewhere → activeAtClinicIds includes clinic.id (but not yours / referred)
//   network        → everything else

export const PATIENTS = [

  // ── c1: Central Sports Physio ────────────────────────────────────────────

  {
    id: "p1",
    name: "James Okafor",
    age: 31,
    condition: "ACL reconstruction rehab (post-op 8 wk)",
    treatments: ["Quad activation drills", "Gait retraining", "Pool therapy"],
    lastVisit: "2025-12-02",
    notes: "Cleared for single-leg balance. Not yet cleared for running.",
    consented: true,
    originClinicId: "c1",
    activeAtClinicIds: ["c1", "c2"], // also doing post-surgical rehab at Bayside
    referredToClinicId: null,
  },
  {
    id: "p2",
    name: "Marcus Webb",
    age: 33,
    condition: "Hamstring complex tear — return to sport",
    treatments: ["Eccentric loading program", "Sprint mechanics retraining", "Sports-specific conditioning"],
    lastVisit: "2025-11-28",
    notes: "75% strength deficit resolved. Cleared for non-contact training.",
    consented: true,
    originClinicId: "c1",
    activeAtClinicIds: ["c1"],
    referredToClinicId: null,
  },
  {
    id: "p3",
    name: "Priya Sharma",
    age: 55,
    condition: "Rotator cuff tendinopathy",
    treatments: ["Eccentric loading program", "Ultrasound therapy", "Postural correction"],
    lastVisit: "2025-10-29",
    notes: "Significant improvement in overhead range. Continue strengthening.",
    consented: false,
    originClinicId: "c1",
    activeAtClinicIds: ["c1", "c2"], // also receiving post-surgical shoulder rehab at Bayside
    referredToClinicId: null,
  },

  // ── c2: Bayside Rehabilitation ───────────────────────────────────────────

  {
    id: "p4",
    name: "Sarah Mitchell",
    age: 42,
    condition: "ACL reconstruction — return-to-sport clearance",
    treatments: ["Single-leg strength testing", "Reactive agility drills", "Sport-specific loading"],
    lastVisit: "2025-12-08",
    notes: "Limb symmetry index 91%. Psychological readiness remains a limiting factor.",
    consented: true,
    originClinicId: "c2",
    activeAtClinicIds: ["c2", "c1"], // referred to Central Sports for return-to-sport
    referredToClinicId: "c1",        // c2 → c1 formal referral
  },
  {
    id: "p5",
    name: "Nina Brooks",
    age: 29,
    condition: "Patellofemoral pain — running-related",
    treatments: ["VMO strengthening", "Running gait retraining", "Load management program"],
    lastVisit: "2025-12-10",
    notes: "Pain resolved on flat surfaces. Downhill still symptomatic. Ongoing.",
    consented: true,
    originClinicId: "c2",
    activeAtClinicIds: ["c2", "c1"], // also seeing Central Sports for running biomechanics
    referredToClinicId: null,
  },
  {
    id: "p6",
    name: "Marcus Chen",
    age: 45,
    condition: "Shoulder labrum repair rehab (post-op 12 wk)",
    treatments: ["Rotator cuff activation", "Scapular stability program", "Progressive overhead loading"],
    lastVisit: "2025-12-18",
    notes: "Full passive ROM restored. Strengthening phase commenced.",
    consented: true,
    originClinicId: "c2",
    activeAtClinicIds: ["c2"],
    referredToClinicId: null,
  },

  // ── c3: Northern Spine Clinic ────────────────────────────────────────────

  {
    id: "p7",
    name: "Diane Kowalski",
    age: 61,
    condition: "Lumbar spinal stenosis",
    treatments: ["Neural mobilisation", "Flexion-bias exercise program", "Hydrotherapy"],
    lastVisit: "2025-11-08",
    notes: "Pain well controlled in flexed postures. Avoid prolonged standing.",
    consented: true,
    originClinicId: "c3",
    activeAtClinicIds: ["c3", "c1"], // referred to Central Sports for gym conditioning
    referredToClinicId: "c1",        // c3 → c1 formal referral
  },
  {
    id: "p8",
    name: "Amir Hossain",
    age: 38,
    condition: "Chronic low back pain — central sensitisation",
    treatments: ["Pain neuroscience education", "Graded motor imagery", "Mindfulness-based movement"],
    lastVisit: "2025-12-05",
    notes: "Significant fear-avoidance beliefs. Progressing slowly but consistently.",
    consented: true,
    originClinicId: "c3",
    activeAtClinicIds: ["c3"],
    referredToClinicId: null,
  },
  {
    id: "p9",
    name: "Frances O'Brien",
    age: 49,
    condition: "Cervical radiculopathy (C6 distribution)",
    treatments: ["Cervical traction", "Neural mobilisation", "Postural correction"],
    lastVisit: "2025-10-21",
    notes: "Tingling largely resolved. Continue home program. Review in 6 weeks.",
    consented: false,
    originClinicId: "c3",
    activeAtClinicIds: ["c3"],
    referredToClinicId: null,
  },

  // ── c4: Eastern Women's Health ───────────────────────────────────────────

  {
    id: "p10",
    name: "Sophia Lindström",
    age: 34,
    condition: "Pelvic girdle pain — antepartum (32 wk)",
    treatments: ["Sacroiliac joint stabilisation", "Pelvic floor education", "Aquatic therapy"],
    lastVisit: "2025-12-01",
    notes: "Managing well at 32 weeks. Compression belt helpful. Review post-partum.",
    consented: true,
    originClinicId: "c4",
    activeAtClinicIds: ["c4"],
    referredToClinicId: null,
  },
  {
    id: "p11",
    name: "Rachel Nguyen",
    age: 29,
    condition: "Post-partum stress urinary incontinence",
    treatments: ["Pelvic floor muscle training", "Bladder training protocol", "Functional movement rehab"],
    lastVisit: "2025-11-20",
    notes: "Significant improvement in leakage episodes. Continue home program.",
    consented: true,
    originClinicId: "c4",
    activeAtClinicIds: ["c4", "c2"], // also receiving abdominal wall rehab at Bayside post c-section
    referredToClinicId: null,
  },

  // ── c5: Westside Paediatric Physio ───────────────────────────────────────

  {
    id: "p12",
    name: "Liam Foster",
    age: 9,
    condition: "Developmental coordination disorder",
    treatments: ["Gross motor skill training", "Sensory integration activities", "School participation coaching"],
    lastVisit: "2025-12-12",
    notes: "Improved ball skills and bilateral coordination. Teacher reports positive classroom changes.",
    consented: true,
    originClinicId: "c5",
    activeAtClinicIds: ["c5"],
    referredToClinicId: null,
  },
  {
    id: "p13",
    name: "Ruby Chen",
    age: 14,
    condition: "Adolescent idiopathic scoliosis (Cobb 22°)",
    treatments: ["Schroth method exercises", "Core stability training", "Postural awareness program"],
    lastVisit: "2025-11-25",
    notes: "Cobb angle stable at last imaging. Continue conservative management. Annual imaging due.",
    consented: true,
    originClinicId: "c5",
    activeAtClinicIds: ["c5", "c3"], // also receiving specialist spinal monitoring at Northern Spine
    referredToClinicId: null,
    referralNote: null,
  },

  // ── Geographic referral (c1 → c2) ────────────────────────────────────────
  // Patient relocated from Melbourne CBD to St Kilda. Not a specialist referral —
  // a generalist-to-generalist handover for continuity of care.

  {
    id: "p14",
    name: "Tom Brekke",
    age: 44,
    condition: "Chronic knee pain — ongoing general physiotherapy",
    treatments: ["Quadriceps strengthening", "Manual therapy", "Activity modification advice"],
    lastVisit: "2025-12-20",
    notes: "Good compliance with home program. Relocated — handover to Bayside for geographic continuity.",
    consented: true,
    originClinicId: "c1",
    activeAtClinicIds: ["c1", "c2"],
    referredToClinicId: "c2",
    referralNote: "Patient relocated — referred for continuity of care.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Classification reference (what each clinic sees):
//
//  Patient          | c1              | c2              | c3            | c4            | c5
//  p1  James Okafor | yours           | seen_elsewhere  | network       | network       | network
//  p2  Marcus Webb  | yours           | network         | network       | network       | network
//  p3  Priya Sharma | yours           | seen_elsewhere  | network       | network       | network
//  p4  Sarah        | referred (←c2)  | yours           | network       | network       | network
//  p5  Nina Brooks  | seen_elsewhere  | yours           | network       | network       | network
//  p6  Marcus Chen  | network         | yours           | network       | network       | network
//  p7  Diane        | referred (←c3)  | network         | yours         | network       | network
//  p8  Amir Hossain | network         | network         | yours         | network       | network
//  p9  Frances      | network         | network         | yours         | network       | network
//  p10 Sophia       | network         | network         | network       | yours         | network
//  p11 Rachel Nguyen| network         | seen_elsewhere  | network       | yours         | network
//  p12 Liam Foster  | network         | network         | network       | network       | yours
//  p13 Ruby Chen    | network         | network         | seen_elsewhere| network       | yours
//  p14 Tom Brekke   | yours           | referred (←c1)  | network       | network       | network
//      (geographic referral — continuity of care, not specialty handover)
// ─────────────────────────────────────────────────────────────────────────────

export const INITIAL_CLINICS = [
  {
    id: "c1",
    name: "Central Sports Physio",
    specialty: "Sports & MSK",
    location: "Melbourne CBD",
    sharing: true,
    shareCount: 8,
    receiveCount: 12,
    referralsGiven: ["c2", "c3"],
    referralsReceived: ["c2", "c3"],
    cooldownUntil: null,
    tier: 2,
    optedOutAt: null,
    pendingTier: null,
    tierCooldownUntil: null,
  },
  {
    id: "c2",
    name: "Bayside Rehabilitation",
    specialty: "Post-surgical rehab",
    location: "St Kilda",
    sharing: false,
    shareCount: 0,
    receiveCount: 0,
    referralsGiven: ["c1"],
    referralsReceived: ["c1"],
    cooldownUntil: null,
    tier: 2,
    optedOutAt: null,
  },
  {
    id: "c3",
    name: "Northern Spine Clinic",
    specialty: "Spinal & chronic pain",
    location: "Brunswick",
    sharing: true,
    shareCount: 14,
    receiveCount: 9,
    referralsGiven: ["c1"],
    referralsReceived: ["c1"],
    cooldownUntil: null,
    tier: 2,
    optedOutAt: null,
  },
  {
    id: "c4",
    name: "Eastern Women's Health",
    specialty: "Women's & pelvic health",
    location: "Box Hill",
    sharing: false,
    shareCount: 0,
    receiveCount: 3,
    referralsGiven: [],
    referralsReceived: [],
    // Pre-seeded in cooldown so the reviewer sees this state on load.
    // Expires ~20 seconds after page load.
    cooldownUntil: Date.now() + COOLDOWN_MS,
    tier: 2,
    optedOutAt: Date.now(), // just opted out — retention countdown starts now
  },
  {
    id: "c5",
    name: "Westside Paediatric Physio",
    specialty: "Paediatric & developmental",
    location: "Footscray",
    sharing: true,
    shareCount: 5,
    receiveCount: 7,
    referralsGiven: [],
    referralsReceived: [],
    cooldownUntil: null,
    tier: 1, // Tier 1 demo — diagnosis only; demonstrates the on-ramp contrast
    optedOutAt: null,
  },
];
