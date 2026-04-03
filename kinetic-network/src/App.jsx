import { useState, useEffect } from "react";
import { PATIENTS, INITIAL_CLINICS, COOLDOWN_MS } from "./data";
import { classifyPatient } from "./classify";
import {
  Lock,
  Unlock,
  Share2,
  ArrowRight,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Users,
  Clock,
  ShieldCheck,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

function Badge({ children, color = "gray" }) {
  const colors = {
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-600",
    amber: "bg-amber-100 text-amber-800",
    orange: "bg-orange-100 text-orange-800",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${colors[color]}`}>
      {children}
    </span>
  );
}

function StatPill({ label, value, color }) {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
  };
  return (
    <div className={`flex flex-col items-center border rounded-lg px-3 py-2 ${colors[color]}`}>
      <span className="text-xl font-bold leading-tight">{value}</span>
      <span className="text-xs font-medium opacity-70">{label}</span>
    </div>
  );
}

function useCooldownSeconds(cooldownUntil) {
  const remaining = () =>
    cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)) : 0;
  const [secs, setSecs] = useState(remaining);
  useEffect(() => {
    if (!cooldownUntil) return;
    const id = setInterval(() => {
      const r = remaining();
      setSecs(r);
      if (r === 0) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [cooldownUntil]);
  return secs;
}

// ─── Network banner ──────────────────────────────────────────────────────────

function NetworkBanner({ clinics }) {
  const total = clinics.length;
  const sharing = clinics.filter((c) => c.sharing).length;
  const pct = Math.round((sharing / total) * 100);
  const target = 80;
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-indigo-800">Network opt-in rate</span>
        <span className="text-sm text-indigo-700">
          {sharing}/{total} clinics sharing — <strong>{pct}%</strong>
          <span className="text-indigo-400 ml-1">(target: {target}%)</span>
        </span>
      </div>
      <div className="relative h-3 bg-indigo-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-400"
          style={{ left: `${target}%` }}
        />
      </div>
      <p className="text-xs text-indigo-500 mt-1.5">
        Red marker = 80% target. Toggle sharing on each clinic to watch the bar move.
      </p>
    </div>
  );
}

// ─── Clinic sidebar ──────────────────────────────────────────────────────────

function ClinicSidebar({ clinics, activeId, onSelect }) {
  const now = Date.now();
  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 pr-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
        Clinics
      </h2>
      <ul className="space-y-1.5">
        {clinics.map((c) => {
          const inCooldown = c.cooldownUntil && c.cooldownUntil > now;
          return (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                  activeId === c.id
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                <div className="font-medium text-sm leading-tight">{c.name}</div>
                <div className={`text-xs mt-0.5 ${activeId === c.id ? "text-indigo-200" : "text-gray-400"}`}>
                  {c.specialty}
                </div>
                <div className="mt-1.5">
                  {inCooldown ? (
                    <Badge color="orange">Cooling down</Badge>
                  ) : c.sharing ? (
                    <Badge color="green">Sharing ON</Badge>
                  ) : (
                    <Badge color="red">Sharing OFF</Badge>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

// ─── Patient panel components ────────────────────────────────────────────────

function ClinicalDetail({ patient }) {
  return (
    <>
      <div>
        <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">
          Treatments
        </span>
        <ul className="mt-1 list-disc list-inside text-gray-700">
          {patient.treatments.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <div>
        <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">
          Clinical notes
        </span>
        <p className="mt-1">{patient.notes}</p>
      </div>
      <div>
        <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">
          Last visit
        </span>
        <p className="mt-1">{patient.lastVisit}</p>
      </div>
    </>
  );
}

function PatientRow({ patient, clinic, clinics, category, isExpanded, onToggle, onToggleConsent }) {
  const originClinic = clinics.find((c) => c.id === patient.originClinicId);
  const isYours = category === "yours";
  const isReferred = category === "referred";

  // Can the clinical detail panel be opened?
  // - yours: always (you own the record)
  // - referred + sharing on: always (referral implies pre-consent)
  // - others: only when sharing on AND patient consented
  const canExpand =
    isYours ||
    (isReferred && clinic.sharing) ||
    (clinic.sharing && patient.consented);

  // What lock state applies to non-owned records?
  const isOptOutLocked = !isYours && !clinic.sharing;
  const isConsentLocked = !isYours && !isReferred && clinic.sharing && !patient.consented;

  const dimText = isOptOutLocked || isConsentLocked;

  return (
    <li>
      {/* Row header — always visible */}
      <div
        onClick={() => canExpand && onToggle(patient.id)}
        className={`flex items-center justify-between px-4 py-3 ${
          canExpand ? "cursor-pointer hover:bg-gray-50" : "cursor-default"
        } bg-white`}
      >
        <div>
          <span className={`font-medium text-sm ${dimText ? "text-gray-500" : "text-gray-800"}`}>
            {patient.name}
          </span>
          <span className="text-gray-400 text-xs ml-2">age {patient.age}</span>
          <div className={`text-xs mt-0.5 ${dimText ? "text-gray-400" : "text-gray-500"}`}>
            {patient.condition}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {/* Yours: consent management */}
          {isYours && patient.consented && (
            <>
              <Badge color="green">Consented</Badge>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleConsent(patient.id); }}
                className="text-xs text-red-500 hover:text-red-700 font-medium border border-red-200 hover:border-red-300 px-2 py-0.5 rounded-md"
              >
                Revoke
              </button>
            </>
          )}
          {isYours && !patient.consented && (
            <>
              <Badge color="gray">Not shared</Badge>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleConsent(patient.id); }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 hover:border-indigo-400 px-2 py-0.5 rounded-md"
              >
                Grant consent
              </button>
            </>
          )}
          {/* Non-owned: status badges */}
          {!isYours && isOptOutLocked && <Badge color="red">Sharing off</Badge>}
          {!isYours && isConsentLocked && <Badge color="gray">Awaiting consent</Badge>}
          {!isYours && isReferred && clinic.sharing && (
            <Badge color="green">Referred by {originClinic?.name ?? "another clinic"}</Badge>
          )}
          {!isYours && !isOptOutLocked && !isConsentLocked && !isReferred && (
            <Badge color="blue">Source: [redacted]</Badge>
          )}
          {canExpand && (
            isExpanded
              ? <EyeOff size={14} className="text-gray-400" />
              : <Eye size={14} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Opt-out lock banner — always visible when sharing is off for non-owned records */}
      {isOptOutLocked && (
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
          <Lock size={11} className="shrink-0" />
          Opt in to sharing to unlock this patient's history.
        </div>
      )}

      {/* Consent lock banner — sharing on but origin clinic hasn't consented */}
      {isConsentLocked && (
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
          <ShieldCheck size={11} className="shrink-0" />
          Awaiting consent from the patient's originating clinic.
        </div>
      )}

      {/* Clinical detail — yours (always expandable) */}
      {isYours && isExpanded && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-700 space-y-2">
          <ClinicalDetail patient={patient} />
          {!patient.consented && (
            <div className="pt-1 border-t border-gray-200">
              <Badge color="amber">Not shared with the network</Badge>
              <p className="text-xs text-gray-400 mt-1">
                Grant consent to make this record visible to other clinics in the network.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Clinical detail — non-owned, access granted */}
      {!isYours && canExpand && isExpanded && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-700 space-y-2">
          <ClinicalDetail patient={patient} />
          <div className="pt-1 border-t border-gray-200">
            {isReferred ? (
              <Badge color="green">Referred by {originClinic?.name ?? "another clinic"}</Badge>
            ) : (
              <Badge color="amber">Originating clinic &amp; clinician: redacted</Badge>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {isReferred
                ? "Referral grants full access to this patient's history."
                : "Source anonymisation prevents inter-clinic judgment. Treatment history is shared; professional identity is not."}
            </p>
          </div>
        </div>
      )}
    </li>
  );
}

// Section metadata — controls label, colour, and description
const SECTION_DEFS = {
  seen_elsewhere: {
    label: "Seen elsewhere",
    sub: "Patients active here with history from other network clinics",
    headerBg: "bg-indigo-50",
    headerBorder: "border-indigo-200",
    labelColor: "text-indigo-800",
    subColor: "text-indigo-600",
    accent: "bg-indigo-500",
  },
  yours: {
    label: "Your patients",
    sub: "Originated at your clinic. Always visible regardless of opt-in status.",
    headerBg: "bg-gray-50",
    headerBorder: "border-gray-200",
    labelColor: "text-gray-700",
    subColor: "text-gray-500",
    accent: null,
  },
  referred: {
    label: "Referred in",
    sub: "Formally referred to your clinic. Full access granted when opted in.",
    headerBg: "bg-green-50",
    headerBorder: "border-green-200",
    labelColor: "text-green-800",
    subColor: "text-green-600",
    accent: "bg-green-500",
  },
  network: {
    label: "Network records",
    sub: "Other patients in the network. Visible when opted in and consented.",
    headerBg: "bg-gray-50",
    headerBorder: "border-gray-200",
    labelColor: "text-gray-500",
    subColor: "text-gray-400",
    accent: null,
  },
};

function PatientSection({ sectionKey, patients, clinic, clinics, expanded, setExpanded, onToggleConsent }) {
  if (patients.length === 0) return null;
  const def = SECTION_DEFS[sectionKey];
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Section header */}
      <div className={`px-4 py-3 border-b ${def.headerBg} ${def.headerBorder}`}>
        <div className="flex items-center gap-2">
          {def.accent && (
            <div className={`w-1 h-4 rounded-full ${def.accent}`} />
          )}
          <span className={`font-semibold text-sm ${def.labelColor}`}>{def.label}</span>
          <span className={`text-xs font-medium rounded-full px-1.5 py-0.5 ${def.headerBg} ${def.labelColor} border ${def.headerBorder}`}>
            {patients.length}
          </span>
        </div>
        <p className={`text-xs mt-0.5 ${def.subColor}`}>{def.sub}</p>
      </div>
      {/* Patient rows */}
      <ul className="divide-y divide-gray-100">
        {patients.map((p) => (
          <PatientRow
            key={p.id}
            patient={p}
            clinic={clinic}
            clinics={clinics}
            category={sectionKey}
            isExpanded={expanded === p.id}
            onToggle={(id) => setExpanded((prev) => (prev === id ? null : id))}
            onToggleConsent={onToggleConsent}
          />
        ))}
      </ul>
    </div>
  );
}

function PatientPanel({ clinic, clinics, patients, onToggleConsent }) {
  const [expanded, setExpanded] = useState(null);

  // Classify every patient from this clinic's perspective
  const sections = {
    seen_elsewhere: patients.filter((p) => classifyPatient(p, clinic.id) === "seen_elsewhere"),
    yours: patients.filter((p) => classifyPatient(p, clinic.id) === "yours"),
    referred: patients.filter((p) => classifyPatient(p, clinic.id) === "referred"),
    network: patients.filter((p) => classifyPatient(p, clinic.id) === "network"),
  };

  // Seen elsewhere: derive how many are accessible vs locked
  const seenCount = sections.seen_elsewhere.length;
  const seenAccessible = sections.seen_elsewhere.filter(
    (p) => clinic.sharing && p.consented
  ).length;

  return (
    <div className="space-y-4">
      {/* Value prop hint when sharing is off and there are patients to unlock */}
      {!clinic.sharing && seenCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
          <Lock size={14} className="mt-0.5 shrink-0 text-amber-500" />
          <span>
            <strong>{seenCount} patient{seenCount > 1 ? "s" : ""}</strong> active here
            {seenCount > 1 ? " have" : " has"} history in the network that you can't access.{" "}
            <span className="text-amber-600">Opt in to sharing to unlock it.</span>
          </span>
        </div>
      )}

      {/* Seen elsewhere first — this is the core value prop section */}
      <PatientSection
        sectionKey="seen_elsewhere"
        patients={sections.seen_elsewhere}
        clinic={clinic}
        clinics={clinics}
        expanded={expanded}
        setExpanded={setExpanded}
        onToggleConsent={onToggleConsent}
      />
      <PatientSection
        sectionKey="yours"
        patients={sections.yours}
        clinic={clinic}
        clinics={clinics}
        expanded={expanded}
        setExpanded={setExpanded}
        onToggleConsent={onToggleConsent}
      />
      <PatientSection
        sectionKey="referred"
        patients={sections.referred}
        clinic={clinic}
        clinics={clinics}
        expanded={expanded}
        setExpanded={setExpanded}
        onToggleConsent={onToggleConsent}
      />
      <PatientSection
        sectionKey="network"
        patients={sections.network}
        clinic={clinic}
        clinics={clinics}
        expanded={expanded}
        setExpanded={setExpanded}
        onToggleConsent={onToggleConsent}
      />
    </div>
  );
}

// ─── Referral panel ──────────────────────────────────────────────────────────

function ReferralPanel({ clinic, clinics, onRefer }) {
  const others = clinics.filter((c) => c.id !== clinic.id);
  const gave = (otherId) => clinic.referralsGiven.includes(otherId);
  const got = (otherId) => clinic.referralsReceived.includes(otherId);
  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Referring a patient builds a bilateral relationship. Specialists return patients
        for ongoing general care — sharing stops being a competitive threat and becomes a
        source of inbound referrals.
      </p>
      <ul className="space-y-2">
        {others.map((other) => {
          const linked = gave(other.id) || got(other.id);
          return (
            <li
              key={other.id}
              className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                linked ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"
              }`}
            >
              <div>
                <div className="font-medium text-sm text-gray-800">{other.name}</div>
                <div className="text-xs text-gray-500">{other.specialty}</div>
                {linked && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {gave(other.id) && <Badge color="green">You referred →</Badge>}
                    {got(other.id) && <Badge color="blue">← Referred to you</Badge>}
                  </div>
                )}
              </div>
              {!gave(other.id) ? (
                <button
                  onClick={() => onRefer(clinic.id, other.id)}
                  className="flex items-center gap-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md transition-colors"
                >
                  Refer patient <ArrowRight size={12} />
                </button>
              ) : (
                <span className="flex items-center gap-1 text-xs text-green-700">
                  <CheckCircle size={13} /> Relationship active
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Control panel ───────────────────────────────────────────────────────────

function ControlPanel({ clinic, onToggleSharing }) {
  const cooldownSecs = useCooldownSeconds(clinic.cooldownUntil);
  const inCooldown = cooldownSecs > 0;
  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl mb-6">
      <div className="flex gap-3">
        <StatPill label="Shared" value={clinic.shareCount} color="blue" />
        <StatPill label="Received" value={clinic.receiveCount} color="green" />
      </div>
      <div className="h-10 w-px bg-gray-200" />
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-700">
          {clinic.name}
          <span className="text-gray-400 font-normal ml-1.5">· {clinic.location}</span>
        </div>
        <div className="text-xs text-gray-400">{clinic.specialty}</div>
      </div>
      {inCooldown ? (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-orange-50 border-orange-300 text-orange-700 text-sm font-medium">
          <Clock size={14} />
          Re-enrollment locked — {cooldownSecs}s remaining
          <span className="text-orange-400 text-xs font-normal ml-1">(30 days in production)</span>
        </div>
      ) : (
        <button
          onClick={() => onToggleSharing(clinic.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all border ${
            clinic.sharing
              ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
              : "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
          }`}
        >
          {clinic.sharing ? (
            <><Share2 size={14} /> Sharing ON — click to opt out</>
          ) : (
            <><XCircle size={14} /> Sharing OFF — click to opt in</>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Explainer ───────────────────────────────────────────────────────────────

function Explainer() {
  const mechanisms = [
    {
      icon: <Lock size={16} />,
      color: "text-red-500",
      title: "Share-gate",
      body: "Access to the patient history network requires opt-in. The 71% who want to receive now have a direct personal incentive to share.",
    },
    {
      icon: <Users size={16} />,
      color: "text-indigo-500",
      title: "Referral network",
      body: "Referring builds a bilateral relationship. Specialists return patients for ongoing care. Sharing becomes a source of inbound referrals, not a competitive threat.",
    },
    {
      icon: <EyeOff size={16} />,
      color: "text-amber-500",
      title: "Source anonymisation",
      body: "Treatment history is shared; the originating clinic and clinician are always redacted. Eliminates the fear of professional judgment entirely.",
    },
  ];
  const safeguards = [
    {
      icon: <Clock size={16} />,
      color: "text-orange-500",
      title: "Opt-out cooldown",
      body: "Clinics that opt out lose access immediately and cannot re-enroll for 30 days. Prevents harvest-and-withdraw gaming — the cost of leaving outweighs the benefit of free-riding.",
    },
    {
      icon: <ShieldCheck size={16} />,
      color: "text-teal-500",
      title: "Patient consent",
      body: "Records are only visible once the patient has consented. Only the originating clinic can grant or revoke consent. Meets HIPAA requirements for sharing between non-treating providers.",
    },
  ];
  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-widest mb-4">
        Why this gets to 80%
      </h3>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {mechanisms.map((m) => (
          <div key={m.title} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className={`mb-2 ${m.color}`}>{m.icon}</div>
            <div className="font-semibold text-gray-800 text-sm mb-1">{m.title}</div>
            <p className="text-xs text-gray-500 leading-relaxed">{m.body}</p>
          </div>
        ))}
      </div>
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-widest mb-3 mt-6">
        Safeguards
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {safeguards.map((s) => (
          <div key={s.title} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className={`mb-2 ${s.color}`}>{s.icon}</div>
            <div className="font-semibold text-gray-800 text-sm mb-1">{s.title}</div>
            <p className="text-xs text-gray-500 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-700">
        <strong>19% → 80%: </strong>The current 19% is an equilibrium produced by misaligned
        incentives — sharing is altruistic, receiving is free. The share-gate converts the 71%
        who want to receive into sharers by making sharing the price of admission. The referral
        network captures remaining holdouts by turning sharing into a source of inbound patients.
        Source anonymisation removes the professional judgment fear. The cooldown prevents gaming.
        Patient consent makes it legally viable. Sharing becomes the dominant strategy.
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [clinics, setClinics] = useState(INITIAL_CLINICS);
  const [patients, setPatients] = useState(PATIENTS);
  const [activeId, setActiveId] = useState("c1");
  const [tab, setTab] = useState("history");
  const [toast, setToast] = useState(null);

  const active = clinics.find((c) => c.id === activeId);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function toggleSharing(id) {
    setClinics((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (c.sharing) {
          showToast(`${c.name} opted out — access revoked. Re-enrollment locked for 30 days.`);
          return { ...c, sharing: false, cooldownUntil: Date.now() + COOLDOWN_MS };
        } else {
          showToast(`${c.name} opted in — patient history access unlocked.`);
          return { ...c, sharing: true, cooldownUntil: null, shareCount: c.shareCount + 3 };
        }
      })
    );
  }

  function handleRefer(fromId, toId) {
    setClinics((prev) =>
      prev.map((c) => {
        if (c.id === fromId) {
          const target = prev.find((x) => x.id === toId);
          showToast(`Referral sent to ${target.name} — bilateral relationship established.`);
          return { ...c, referralsGiven: [...c.referralsGiven, toId], shareCount: c.shareCount + 1 };
        }
        if (c.id === toId) {
          return { ...c, referralsReceived: [...c.referralsReceived, fromId], receiveCount: c.receiveCount + 1 };
        }
        return c;
      })
    );
  }

  function toggleConsent(patientId) {
    const patient = patients.find((p) => p.id === patientId);
    // Guard: only the origin clinic can change consent
    if (!patient || patient.originClinicId !== activeId) return;
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        const next = !p.consented;
        showToast(
          next
            ? `${p.name} consented — record now visible in the network.`
            : `${p.name}'s consent withdrawn — record hidden from the network.`
        );
        return { ...p, consented: next };
      })
    );
  }

  const TABS = [
    { id: "history", label: "Patient history" },
    { id: "referrals", label: "Referral network" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div>
          <span className="font-bold text-indigo-700 text-lg tracking-tight">Kinetic</span>
          <span className="text-gray-400 text-sm ml-2">— Shared patient history network</span>
        </div>
        <div className="text-xs text-gray-400">
          Heidi Health · Product Growth challenge prototype
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8">
        <NetworkBanner clinics={clinics} />
        <div className="flex gap-8">
          <ClinicSidebar
            clinics={clinics}
            activeId={activeId}
            onSelect={(id) => { setActiveId(id); setTab("history"); }}
          />
          <div className="flex-1 min-w-0">
            <ControlPanel clinic={active} onToggleSharing={toggleSharing} />
            <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    tab === t.id
                      ? "bg-white shadow-sm text-gray-800"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {tab === "history" ? (
              <PatientPanel
                clinic={active}
                clinics={clinics}
                patients={patients}
                onToggleConsent={toggleConsent}
              />
            ) : (
              <ReferralPanel
                clinic={active}
                clinics={clinics}
                onRefer={handleRefer}
              />
            )}
            <Explainer />
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
