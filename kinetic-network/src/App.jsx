import { useState, useEffect } from "react";
import { PATIENTS, INITIAL_CLINICS, COOLDOWN_MS } from "./data";
import { classifyPatient } from "./classify";
import {
  Lock,
  Share2,
  ArrowRight,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Users,
  Clock,
  ShieldCheck,
  Layers,
} from "lucide-react";

// ─── constants ───────────────────────────────────────────────────────────────

const TIER_LABELS = {
  1: "Diagnosis only",
  2: "Diagnosis + treatment",
  3: "Full history",
};

// Retention: 24 simulated months, 1 month per 1.25 seconds = 30s total
const RETENTION_MONTHS = 24;
const MS_PER_MONTH = 1250;

// Tier downgrade cooldown: 7 days in production, 10 seconds in demo
const TIER_COOLDOWN_MS = 10 * 1000;

// ─── helpers ────────────────────────────────────────────────────────────────

function Badge({ children, color = "gray" }) {
  const colors = {
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-600",
    amber: "bg-amber-100 text-amber-800",
    orange: "bg-orange-100 text-orange-800",
    purple: "bg-purple-100 text-purple-700",
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
    cooldownUntil ? Math.max(0, Math.floor((cooldownUntil - Date.now()) / 1000)) : 0;
  const [secs, setSecs] = useState(remaining);
  useEffect(() => {
    if (!cooldownUntil) return;
    setSecs(remaining());
    const id = setInterval(() => {
      const r = remaining();
      setSecs(r);
      if (r === 0) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [cooldownUntil]);
  return secs;
}

// Ticks down from RETENTION_MONTHS to 0 once optedOutAt is set.
// Returns RETENTION_MONTHS when optedOutAt is null (not opted out).
function useRetentionMonths(optedOutAt) {
  const calc = () =>
    optedOutAt
      ? Math.max(0, RETENTION_MONTHS - Math.floor((Date.now() - optedOutAt) / MS_PER_MONTH))
      : RETENTION_MONTHS;
  const [months, setMonths] = useState(calc);
  useEffect(() => {
    if (!optedOutAt) return;
    const id = setInterval(() => {
      const m = calc();
      setMonths(m);
      if (m === 0) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [optedOutAt]);
  return months;
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
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  {inCooldown ? (
                    <Badge color="orange">Cooling down</Badge>
                  ) : c.sharing ? (
                    <Badge color="green">Sharing ON</Badge>
                  ) : (
                    <Badge color="red">Sharing OFF</Badge>
                  )}
                  <Badge color="purple">T{c.tier}</Badge>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

// ─── Clinical detail (tier-aware) ────────────────────────────────────────────
// viewerTier === null means the viewer owns/referred the record — show everything.
// viewerTier 1/2/3 gates what fields are visible.

function ClinicalDetail({ patient, viewerTier }) {
  const showTreatments = viewerTier === null || viewerTier >= 2;
  const showNotes = viewerTier === null || viewerTier >= 3;

  return (
    <div className="space-y-2">
      <div>
        <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">
          Diagnosis
        </span>
        <p className="mt-1 text-gray-700">{patient.condition}</p>
      </div>

      {showTreatments ? (
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
      ) : (
        <div className="text-xs text-gray-400 italic border border-dashed border-gray-200 rounded px-3 py-2">
          Treatment history not available — upgrade to Tier 2 to unlock.
        </div>
      )}

      {showNotes ? (
        <>
          <div>
            <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">
              Clinical notes
            </span>
            <p className="mt-1 text-gray-700">{patient.notes}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">
              Last visit
            </span>
            <p className="mt-1 text-gray-700">{patient.lastVisit}</p>
          </div>
        </>
      ) : showTreatments ? (
        <div className="text-xs text-gray-400 italic border border-dashed border-gray-200 rounded px-3 py-2">
          Clinical notes and outcomes not available — upgrade to Tier 3 to unlock.
        </div>
      ) : null}
    </div>
  );
}

// ─── Patient row ─────────────────────────────────────────────────────────────

function PatientRow({ patient, clinic, clinics, category, isExpanded, onToggle, onToggleConsent }) {
  const originClinic = clinics.find((c) => c.id === patient.originClinicId);
  const isYours = category === "yours";
  const isReferred = category === "referred";

  const isOptOutLocked = !isYours && !clinic.sharing;
  const isConsentLocked = !isYours && !isReferred && clinic.sharing && !patient.consented;
  const dimText = isOptOutLocked || isConsentLocked;

  // Retention countdown — only meaningful when this clinic has an optedOutAt timestamp
  const retentionMonths = useRetentionMonths(isOptOutLocked ? clinic.optedOutAt : null);
  const isExpired = isOptOutLocked && clinic.optedOutAt !== null && retentionMonths === 0;

  // Tier for viewing non-owned records. Referred = full access (null = show all).
  const viewerTier = isYours || isReferred ? null : clinic.tier;

  const canExpand =
    isYours ||
    (isReferred && clinic.sharing) ||
    (clinic.sharing && patient.consented && !isExpired);

  // Tombstone — replaces the row entirely when retention has expired
  if (isExpired) {
    return (
      <li className="px-4 py-3 bg-gray-100 flex items-center gap-2 text-xs text-gray-400 italic">
        <XCircle size={13} className="shrink-0 text-gray-300" />
        Record expired — re-enrollment required to restore access.
      </li>
    );
  }

  return (
    <li>
      {/* Row header */}
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
          {/* Referral note — shown on row for referred-in patients */}
          {isReferred && patient.referralNote && (
            <div className="text-xs text-green-600 mt-0.5 italic">{patient.referralNote}</div>
          )}
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
          {/* Tier badge for non-owned accessible records */}
          {!isYours && !isOptOutLocked && !isConsentLocked && !isReferred && (
            <Badge color="purple">T{clinic.tier}</Badge>
          )}
          {canExpand && (
            isExpanded
              ? <EyeOff size={14} className="text-gray-400" />
              : <Eye size={14} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Opt-out lock banner with retention countdown */}
      {isOptOutLocked && (
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Lock size={11} className="shrink-0" />
            Opt in to sharing to unlock this patient's history.
          </div>
          {clinic.optedOutAt !== null && (
            <span className={`font-semibold tabular-nums ${retentionMonths <= 6 ? "text-red-400" : "text-orange-400"}`}>
              {retentionMonths}mo remaining
            </span>
          )}
        </div>
      )}

      {/* Consent lock banner */}
      {isConsentLocked && (
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
          <ShieldCheck size={11} className="shrink-0" />
          Awaiting consent from the patient's originating clinic.
        </div>
      )}

      {/* Clinical detail — yours (always expandable, always full detail) */}
      {isYours && isExpanded && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-700">
          <ClinicalDetail patient={patient} viewerTier={null} />
          {!patient.consented && (
            <div className="pt-2 mt-2 border-t border-gray-200">
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
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-700">
          <ClinicalDetail patient={patient} viewerTier={viewerTier} />
          <div className="pt-2 mt-2 border-t border-gray-200">
            {isReferred ? (
              <>
                <Badge color="green">Referred by {originClinic?.name ?? "another clinic"}</Badge>
                <p className="text-xs text-gray-400 mt-1">
                  Referral grants full access to this patient's history.
                </p>
              </>
            ) : (
              <>
                <Badge color="amber">Originating clinic &amp; clinician: redacted</Badge>
                <p className="text-xs text-gray-400 mt-1">
                  Source anonymisation prevents inter-clinic judgment. Treatment history is
                  shared; professional identity is not.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

// ─── Section metadata ─────────────────────────────────────────────────────────

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
      <div className={`px-4 py-3 border-b ${def.headerBg} ${def.headerBorder}`}>
        <div className="flex items-center gap-2">
          {def.accent && <div className={`w-1 h-4 rounded-full ${def.accent}`} />}
          <span className={`font-semibold text-sm ${def.labelColor}`}>{def.label}</span>
          <span className={`text-xs font-medium rounded-full px-1.5 py-0.5 ${def.headerBg} ${def.labelColor} border ${def.headerBorder}`}>
            {patients.length}
          </span>
        </div>
        <p className={`text-xs mt-0.5 ${def.subColor}`}>{def.sub}</p>
      </div>
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

  const sections = {
    seen_elsewhere: patients.filter((p) => classifyPatient(p, clinic.id) === "seen_elsewhere"),
    yours: patients.filter((p) => classifyPatient(p, clinic.id) === "yours"),
    referred: patients.filter((p) => classifyPatient(p, clinic.id) === "referred"),
    network: patients.filter((p) => classifyPatient(p, clinic.id) === "network"),
  };

  const seenCount = sections.seen_elsewhere.length;

  return (
    <div className="space-y-4">
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
      <PatientSection sectionKey="seen_elsewhere" patients={sections.seen_elsewhere} clinic={clinic} clinics={clinics} expanded={expanded} setExpanded={setExpanded} onToggleConsent={onToggleConsent} />
      <PatientSection sectionKey="yours" patients={sections.yours} clinic={clinic} clinics={clinics} expanded={expanded} setExpanded={setExpanded} onToggleConsent={onToggleConsent} />
      <PatientSection sectionKey="referred" patients={sections.referred} clinic={clinic} clinics={clinics} expanded={expanded} setExpanded={setExpanded} onToggleConsent={onToggleConsent} />
      <PatientSection sectionKey="network" patients={sections.network} clinic={clinic} clinics={clinics} expanded={expanded} setExpanded={setExpanded} onToggleConsent={onToggleConsent} />
    </div>
  );
}

// ─── Referral panel ──────────────────────────────────────────────────────────

function ReferralPanel({ clinic, clinics, patients, onRefer }) {
  const others = clinics.filter((c) => c.id !== clinic.id);
  const gave = (otherId) => clinic.referralsGiven.includes(otherId);
  const got = (otherId) => clinic.referralsReceived.includes(otherId);

  // Look up any referral note for a given outgoing referral
  const getReferralNote = (toId) =>
    patients.find(
      (p) => p.originClinicId === clinic.id && p.referredToClinicId === toId && p.referralNote
    )?.referralNote ?? null;

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
          const note = getReferralNote(other.id);
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
                {note && (
                  <p className="text-xs text-gray-500 mt-1 italic">{note}</p>
                )}
              </div>
              {!gave(other.id) ? (
                <button
                  onClick={() => onRefer(clinic.id, other.id)}
                  className="flex items-center gap-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md transition-colors shrink-0 ml-3"
                >
                  Refer patient <ArrowRight size={12} />
                </button>
              ) : (
                <span className="flex items-center gap-1 text-xs text-green-700 shrink-0 ml-3">
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

function ControlPanel({ clinic, onToggleSharing, onSetTier }) {
  const cooldownSecs = useCooldownSeconds(clinic.cooldownUntil);
  const inCooldown = cooldownSecs > 0;
  const tierCooldownSecs = useCooldownSeconds(clinic.tierCooldownUntil);
  const inTierCooldown = tierCooldownSecs > 0;
  // Days remaining for display (7-day cooldown, 10s demo → scale back to days)
  const tierDaysRemaining = Math.ceil((tierCooldownSecs / TIER_COOLDOWN_MS) * 1000 * 7);

  return (
    <div className="bg-white border border-gray-200 rounded-xl mb-6 overflow-hidden">
      {/* Main row */}
      <div className="flex items-center gap-4 p-4">
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

      {/* Tier selector row */}
      <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Layers size={13} />
          <span className="font-medium">Sharing tier</span>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {[1, 2, 3].map((t) => (
            <button
              key={t}
              onClick={() => !inTierCooldown && onSetTier(clinic.id, t)}
              disabled={inTierCooldown}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                inTierCooldown
                  ? "opacity-40 cursor-not-allowed text-gray-400"
                  : clinic.tier === t
                  ? "bg-white shadow-sm text-indigo-700 border border-indigo-100"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              T{t}
            </button>
          ))}
        </div>
        {inTierCooldown ? (
          <span className="text-xs text-orange-600 font-medium">
            Downgrade pending — {tierDaysRemaining} day{tierDaysRemaining !== 1 ? "s" : ""} remaining
            <span className="text-orange-400 font-normal ml-1">({tierCooldownSecs}s)</span>
          </span>
        ) : (
          <span className="text-xs text-gray-400">{TIER_LABELS[clinic.tier]}</span>
        )}
        <span className="text-xs text-gray-300 ml-auto">
          Access received from the network mirrors your contribution tier
        </span>
      </div>
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
      body: "Referring builds a bilateral relationship. Specialists return patients for ongoing care. Geographically mobile patients are referred between generalist clinics for continuity of care.",
    },
    {
      icon: <EyeOff size={16} />,
      color: "text-amber-500",
      title: "Source anonymisation",
      body: "Treatment history is shared; the originating clinic and clinician are always redacted. Eliminates the fear of professional judgment entirely.",
    },
    {
      icon: <Layers size={16} />,
      color: "text-purple-500",
      title: "Tiered sharing",
      body: "Clinics choose what they contribute — diagnosis only (T1), diagnosis and treatment (T2), or full history (T3). Access mirrors tier. Lowers the barrier for skeptical clinics.",
    },
  ];
  const safeguards = [
    {
      icon: <Clock size={16} />,
      color: "text-orange-500",
      title: "Opt-out cooldown",
      body: "Clinics that opt out lose access immediately and cannot re-enroll for 30 days. Prevents harvest-and-withdraw gaming.",
    },
    {
      icon: <Clock size={16} />,
      color: "text-red-400",
      title: "Data retention",
      body: "Records received while opted in remain accessible for 24 months post opt-out, then purge. Simulated as a 30-second per-card countdown.",
    },
    {
      icon: <ShieldCheck size={16} />,
      color: "text-teal-500",
      title: "Patient consent",
      body: "Records are only visible once the patient has consented. Only the originating clinic can grant or revoke consent.",
    },
  ];
  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-widest mb-4">
        Why this gets to 80%
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
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
      <div className="grid grid-cols-3 gap-4">
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
        who want to receive into sharers by making sharing the price of admission. Tiered sharing
        removes the all-or-nothing barrier, giving skeptical clinics a low-risk entry point.
        The referral network captures remaining holdouts by turning sharing into a source of
        inbound patients. Source anonymisation removes the professional judgment fear. The cooldown
        and retention policy prevent gaming. Sharing becomes the dominant strategy.
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

  // Apply pending tier downgrades when their cooldown expires
  useEffect(() => {
    const hasPending = clinics.some((c) => c.pendingTier !== null && c.tierCooldownUntil !== null);
    if (!hasPending) return;
    const id = setInterval(() => {
      const now = Date.now();
      setClinics((prev) =>
        prev.map((c) => {
          if (c.pendingTier === null || c.tierCooldownUntil === null) return c;
          if (now >= c.tierCooldownUntil) {
            return { ...c, tier: c.pendingTier, pendingTier: null, tierCooldownUntil: null };
          }
          return c;
        })
      );
    }, 500);
    return () => clearInterval(id);
  }, [clinics.some((c) => c.pendingTier !== null)]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function toggleSharing(id) {
    setClinics((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (c.sharing) {
          const hadPendingDowngrade = c.pendingTier !== null && c.tierCooldownUntil !== null;
          showToast(
            hadPendingDowngrade
              ? `${c.name} opted out — pending tier downgrade cancelled. Re-enrollment locked for 30 days.`
              : `${c.name} opted out — access revoked. Re-enrollment locked for 30 days.`
          );
          return {
            ...c,
            sharing: false,
            cooldownUntil: Date.now() + COOLDOWN_MS,
            optedOutAt: Date.now(),
            // Cancel pending tier downgrade — opt-out applies the longer penalty
            pendingTier: null,
            tierCooldownUntil: null,
          };
        } else {
          showToast(`${c.name} opted in — patient history access unlocked.`);
          return { ...c, sharing: true, cooldownUntil: null, optedOutAt: null, shareCount: c.shareCount + 3 };
        }
      })
    );
  }

  function setTier(id, tier) {
    setClinics((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (tier === c.tier) return c;
        if (tier > c.tier) {
          // Upgrade — instant, clear any pending downgrade
          showToast(`${c.name} upgraded to ${TIER_LABELS[tier]} — effective immediately.`);
          return { ...c, tier, pendingTier: null, tierCooldownUntil: null };
        } else {
          // Downgrade — 7-day cooldown (10s demo)
          showToast(`${c.name} downgrade to ${TIER_LABELS[tier]} pending — effective in 7 days.`);
          return { ...c, pendingTier: tier, tierCooldownUntil: Date.now() + TIER_COOLDOWN_MS };
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
            <ControlPanel
              clinic={active}
              onToggleSharing={toggleSharing}
              onSetTier={setTier}
            />
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
                patients={patients}
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
