/**
 * Returns the category string for how a given clinic sees a given patient.
 * Categories are mutually exclusive. Priority order matters:
 *   yours > referred > seen_elsewhere > network
 *
 * @param {object} patient
 * @param {string} clinicId
 * @returns {"yours" | "referred" | "seen_elsewhere" | "network"}
 */
export function classifyPatient(patient, clinicId) {
  if (patient.originClinicId === clinicId) return "yours";
  if (patient.referredToClinicId === clinicId) return "referred";
  if (patient.activeAtClinicIds.includes(clinicId)) return "seen_elsewhere";
  return "network";
}
