# Kinetic Network — Incentive-Driven Patient History Sharing

A working prototype built for the Heidi Health Product Growth challenge.

**Live demo:** `cd kinetic-network && npm install && npm run dev`

---

## The problem

Kinetic is a B2B SaaS platform used by 1,800 independent physiotherapy clinics. Patients increasingly see multiple physios across locations and specialties, but each clinic treats them as a brand-new patient.

Clinics have asked for shared patient history. But incentives are misaligned:

- **71%** want to receive history from other clinics
- **19%** want to share theirs
- Primary fear: *"I don't want to help patients switch to competitors."*
- Secondary fear: *"What if another physio judges my treatment?"*

This is not a policy problem. It is an incentive design problem. The goal is to get opt-in from 80%+ of clinics.

---

## The system

The design rests on one insight: **you don't need to convince clinics to be generous. You need to make sharing the selfish choice.**

Five mechanisms do that — three that create positive incentives, two that close off the ways to game the system.

### 1. Share-gate

Access to the shared patient history network is contingent on opting in to share. A clinic that wants to receive must share first — access is granted on opt-in and revoked in real time on opt-out.

This converts the 71% who want to receive into active sharers. The cost of not sharing (losing access to a network you want) now outweighs the fear of sharing. The share-gate alone closes most of the gap from 19% to 80%.

### 2. Referral network

Clinics can refer patients to other clinics that specialise in areas outside their scope. Sending a referral establishes a bilateral relationship: the specialist gets the patient, the referring clinic gets future patients referred back for general care.

This reframes the competitive dynamic entirely. Sharing is no longer *"I might lose this patient"* — it is *"I am building a network that sends patients to me."* This captures the remaining holdouts for whom the share-gate alone is not enough.

### 3. Source anonymisation

Patient treatment history is shared across the network. The originating clinic and clinician are always redacted. A receiving clinic sees diagnosis, treatment history, and clinical notes — but never which clinic or practitioner produced them.

This eliminates the professional judgment fear completely. There is no way to identify whose work you are reading.

### 4. Opt-out cooldown

A clinic that opts out loses access immediately and cannot re-enrol for 30 days. This closes off the obvious exploit: opt in, harvest the full patient history you need, then opt out to stop reciprocating while keeping what you gained. The 30-day lockout makes this irrational — the cost of leaving outweighs any short-term benefit.

The prototype demos this with a 20-second cooldown so the state is observable. Eastern Women's Health starts in cooldown on page load with a live countdown in the control bar.

### 5. Patient consent

Patient records are only visible in the network once the patient has explicitly consented to sharing. Records without consent appear in the list but their clinical content is locked. Consent can be granted or withdrawn at any time.

This reflects the real-world legal constraint: HIPAA requires patient authorisation for sharing records between non-treating providers. The system is not viable without it. A natural extension is tiered consent — a patient can consent to share with any clinic in the network, or only with clinics their current provider has referred them to, which reinforces the referral network mechanism.

---

## How 19% becomes 80%

The current 19% is an equilibrium produced entirely by misaligned incentives. Sharing is a purely altruistic act with no upside and real competitive downside. Receiving is free.

The five mechanisms dismantle each blocker:

| Blocker | Mechanism | Effect |
|---|---|---|
| "Sharing helps competitors" | Share-gate | Sharing becomes the price of admission to a network you want |
| "Sharing helps competitors" | Referral network | Sharing generates inbound referrals — net positive, not net negative |
| "Colleagues will judge my work" | Source anonymisation | Identity is structurally hidden — judgment is impossible |
| "I'll opt out once I've taken what I need" | Opt-out cooldown | Exit is costly — 30-day lockout makes gaming irrational |
| Legal/compliance exposure | Patient consent | HIPAA-compliant by design — consent is required before any record is shared |

In the new equilibrium, sharing is the dominant strategy. Opting out means losing access to a network that improves your clinical work, losing referral relationships that generate inbound patients, and accepting a 30-day lockout. The rational clinic opts in and stays in.

---

## Prototype walkthrough

The app simulates 5 clinics at different points in the adoption curve. Each can be viewed from its own perspective.

**Suggested path for reviewers:**

1. **Open the app.** The network banner shows the current opt-in rate vs. the 80% target. Three clinics are sharing, two are not.

2. **Select Eastern Women's Health.** The control bar shows a live cooldown countdown — this clinic recently opted out and is locked out of re-enrollment. Watch the countdown expire, then toggle sharing back on.

3. **Select Bayside Rehabilitation** (sharing off, no cooldown). The patient history tab is locked. This is the pre-system state — a clinic that wants to receive but won't share.

4. **Toggle sharing on.** Access unlocks immediately. The network banner updates. The share count increments to reflect records now entering the network.

5. **Notice two patient records are locked** (Priya Sharma, Elena Vasquez). These patients haven't consented. The record header is visible but the clinical content is hidden. Click "Grant consent" on one — the record unlocks and the access counter updates.

6. **Expand a consented record.** Every record shows `Source: [redacted]`. The anonymisation is structural — there is no way to reveal the originating clinic or clinician.

7. **Switch to the Referral network tab.** Send a referral to another clinic. Watch the bilateral relationship form — both clinics now show the connection as active.

8. **Toggle sharing off on any clinic.** The control bar immediately switches to the cooldown state. Access is revoked instantly.

9. **Toggle all 5 clinics to sharing on.** The banner hits 100%. All five mechanics are visible end-to-end.

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
    App.jsx      # All UI components and state logic
    data.js      # Simulated clinic and patient data
    index.css    # Tailwind import
  index.html
  vite.config.js
```
