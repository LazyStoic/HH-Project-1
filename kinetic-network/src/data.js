// Cooldown duration for demo — short enough to observe expire live.
// In production this would be 30 days.
export const COOLDOWN_MS = 20 * 1000;

// Simulated patient history pool — source clinic is always redacted.
// `consented` reflects whether the patient has authorised sharing within the
// Kinetic network. Records without consent are visible in the list but their
// clinical content is locked (HIPAA requires patient authorisation for sharing
// between non-treating providers).
export const PATIENTS = [
  {
    id: "p1",
    name: "Sarah Mitchell",
    age: 42,
    condition: "Lumbar disc herniation",
    treatments: ["Manual therapy", "Core stabilisation program", "Dry needling"],
    lastVisit: "2024-11-14",
    notes: "Good response to manual therapy. Avoid heavy lifting > 8 kg.",
    consented: true,
  },
  {
    id: "p2",
    name: "James Okafor",
    age: 31,
    condition: "ACL reconstruction rehab (post-op 8 wk)",
    treatments: ["Quad activation drills", "Gait retraining", "Pool therapy"],
    lastVisit: "2024-12-02",
    notes: "Cleared for single-leg balance. Not yet cleared for running.",
    consented: true,
  },
  {
    id: "p3",
    name: "Priya Sharma",
    age: 55,
    condition: "Rotator cuff tendinopathy",
    treatments: ["Eccentric loading program", "Ultrasound therapy", "Postural correction"],
    lastVisit: "2024-10-29",
    notes: "Significant improvement in overhead range. Continue strengthening.",
    consented: false,
  },
  {
    id: "p4",
    name: "Tom Brekke",
    age: 67,
    condition: "Knee osteoarthritis",
    treatments: ["Exercise therapy", "Hydrotherapy", "TENS"],
    lastVisit: "2024-11-30",
    notes: "Manages well with daily walking program. Monitor for flare-ups.",
    consented: true,
  },
  {
    id: "p5",
    name: "Elena Vasquez",
    age: 28,
    condition: "Patellofemoral pain syndrome",
    treatments: ["VMO strengthening", "Taping", "Bike fit assessment"],
    lastVisit: "2024-12-10",
    notes: "Pain resolved at rest. Still symptomatic on stairs — ongoing.",
    consented: false,
  },
];

export const INITIAL_CLINICS = [
  {
    id: "c1",
    name: "Central Sports Physio",
    specialty: "Sports & MSK",
    location: "Melbourne CBD",
    sharing: true,
    shareCount: 8,
    receiveCount: 12,
    referralsGiven: ["c3"],
    referralsReceived: ["c3"],
    cooldownUntil: null,
  },
  {
    id: "c2",
    name: "Bayside Rehabilitation",
    specialty: "Post-surgical rehab",
    location: "St Kilda",
    sharing: false,
    shareCount: 0,
    receiveCount: 0,
    referralsGiven: [],
    referralsReceived: [],
    cooldownUntil: null,
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
  },
];
