# Kinetic Network

**Live demo:** `cd kinetic-network && npm install && npm run dev` → http://localhost:5173

---

## What this is

A working prototype built as a submission for Heidi Health's Entry Program Product Growth challenge. Kinetic is a fictional B2B SaaS platform used by 1,800 independent physiotherapy clinics. The problem: only 19% of clinics share patient history despite 71% wanting to receive it. This prototype demonstrates a system that makes sharing the rational, selfish choice.

---

## The two fears blocking sharing

- **Fear 1:** "I'll help patients switch to competitors."
- **Fear 2:** "Other physios will judge my treatment quality."

---

## The three core mechanisms

**Share-gate** — access to the network requires opt-in. The 71% who want to receive now have a direct personal incentive to share. Converts sharing from altruistic to transactional.

**Referral network** — referring a patient builds a bilateral relationship. Specialists return patients for ongoing general care. Geographically mobile patients get referred between generalist clinics for continuity of care. Reframes sharing from "losing a patient" to "building a network."

**Source anonymisation** — treatment history is shared but the originating clinic and clinician are always redacted. Eliminates the professional judgment fear entirely.

---

## Tiered sharing

Clinics choose what they contribute:

| Tier | What is shared | Access received |
|---|---|---|
| T1 — Diagnosis only | Condition / diagnosis | Diagnosis only |
| T2 — Diagnosis + treatment | Condition + treatment history | Condition + treatment |
| T3 — Full history | Condition + treatment + notes + outcomes | Full history |

Access received from the network mirrors tier contributed. Lowers the barrier to entry for skeptical clinics and provides an on-ramp for early adoption: a clinic starts at Tier 1, sees value, moves up. All opted-in clinics default to Tier 2. Westside Paediatric Physio starts at Tier 1 to demonstrate the contrast.

The tier selector is visible in each clinic's control panel alongside the opt-in/opt-out toggle.

Upgrading is instant. Downgrading triggers a 7-day cooldown to prevent clinics from temporarily elevating their tier to harvest higher-quality records then immediately dropping back down.

---

## Safeguards

**30-day opt-out cooldown** — clinics that opt out lose access immediately and cannot re-enroll for 30 days. Prevents harvest-and-withdraw gaming. Simulated as a 20-second countdown in the prototype.

**Data retention** — records received while opted in remain accessible for 24 months post opt-out in compliance with applicable health data regulations, then purge. Each frozen record card displays a live countdown. When the counter hits zero the card is replaced with a greyed tombstone: *"Record expired — re-enrollment required to restore access."* Simulated as a 30-second countdown (1 month per 1.25 seconds).

**Patient consent** — records are only visible in the network once the patient has consented. Consent is owned by the originating clinic only. Non-origin clinics see "Awaiting consent" with no option to interact.

**Cooldown hierarchy** — upgrading tier is instant. Downgrading tier triggers a 7-day cooldown. Opting out entirely triggers a 30-day cooldown. A clinic cannot bypass the tier downgrade cooldown by opting out — opting out applies the longer 30-day cooldown regardless. The penalty scales with the severity of withdrawal.

---

## 19% → 80% argument

The current 19% is an equilibrium produced entirely by misaligned incentives — sharing is altruistic, receiving is free. The share-gate converts the 71% who want to receive into sharers by making sharing the price of admission. Tiered sharing removes the all-or-nothing barrier, giving skeptical clinics a low-risk entry point. The referral network captures remaining holdouts by turning sharing into a source of inbound patients. Source anonymisation removes the professional judgment fear. The cooldown and retention policy prevent gaming. Sharing becomes the dominant strategy.

---

## Known limitations and how they'd be addressed at scale

**Cold start problem** — the network is thin early and value doesn't materialise until critical mass. Proposed fix: seed the early network with anonymised historical data, offer founding member status with premium feature access to clinics that opt in during the first 90 days, and launch geographically — one city at a time — rather than nationally.

**Consent friction** — patient consent is legally correct but operationally burdensome if bolted on after intake. At scale, consent collection needs to be embedded in the patient intake workflow, not managed separately.

**Generalist referral weakness partially addressed** — geographic patient mobility creates natural referral flow between generalist clinics even without specialty overlap. The prototype includes a pre-existing referral between Central Sports Physio and Bayside Rehabilitation with the note *"Patient relocated — referred for continuity of care."*

---

## Alternative architectures considered

**Patient-driven portability** — patients control their own record sharing directly, removing the competitive dynamic between clinics entirely. Rejected as primary mechanism because patient adoption friction is high and the problem brief specifically asks for a clinic-level incentive solution.

**Outcome transparency model** — sharing builds a clinic's publicly visible outcome score rather than gating access. Weaker incentive than the gate — reputational benefit is diffuse and slow. Better as a secondary feature than a primary mechanism.

**Insurance/billing integration as Trojan horse** — shared history becomes a byproduct of billing workflows clinics are already running. Powerful but requires deep EHR and insurer integrations that are outside scope for an early-stage product. Worth revisiting at scale.

---

## Prototype walkthrough

5 simulated clinics, each at a different point in the adoption curve.

**Suggested path for reviewers:**

1. **Open the app.** Network banner shows current opt-in rate vs. 80% target.

2. **Select Eastern Women's Health.** Live cooldown countdown in the control bar — recently opted out. Watch it expire, then toggle sharing back on. On opted-out clinics, every non-owned record shows a retention countdown (*"Xmo remaining"*). At zero, the card becomes a tombstone.

3. **Select Westside Paediatric Physio.** This clinic is opted in at Tier 1. Expand a network record — only the diagnosis is visible. Switch to T2 in the tier selector and watch treatment history appear. Switch to T3 and watch clinical notes unlock.

4. **Select Bayside Rehabilitation** (sharing off). The amber banner shows how many patients are inaccessible. Each non-owned record shows the opt-in lock and a retention countdown if the clinic has an opt-out timestamp.

5. **Toggle Bayside sharing on.** Records unlock based on consent status. James Okafor and Nina Brooks are visible (consented). Priya Sharma stays locked — awaiting consent from Central Sports Physio, the originating clinic.

6. **Switch to Central Sports Physio.** Under "Your patients", Priya Sharma shows "Not shared." Click "Grant consent" — the record is now visible network-wide. Only Central Sports sees this button. Other clinics see "Awaiting consent" with no option to interact.

7. **Check the Referral network tab on Central Sports.** The c1 → c2 relationship card shows *"Patient relocated — referred for continuity of care."* — a geographic generalist referral, pre-existing in the default state.

8. **Switch to Bayside and check "Referred in".** Tom Brekke appears with the "Referred by Central Sports Physio" badge and full clinical access (referral implies pre-consent).

9. **Toggle all 5 clinics to sharing on.** Banner hits 100%. All mechanics are visible end-to-end.

---

## Tech

- React + Vite
- Tailwind CSS v4
- lucide-react (icons)
- No backend. All state in memory.

```bash
cd kinetic-network
npm install
npm run dev
```

---

## Files

```
kinetic-network/
  src/
    App.jsx       # All UI components and state logic
    data.js       # Simulated clinic and patient data (14 patients, 5 clinics)
    classify.js   # classifyPatient(patient, clinicId) — pure classification helper
    index.css     # Tailwind import
  index.html
  vite.config.js
```
