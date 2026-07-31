export const todayStr = () => new Date().toISOString().split("T")[0];

// Calcule le lundi de la semaine contenant `date`
// Retourne le lundi de la semaine ISO contenant `date` (lun=1er jour, dim=7e jour).
// Ancrage via le mardi (immunisé contre tout décalage timezone) puis -1 jour.
// Dimanche (dow=0) est le 7e jour → son mardi ISO = dimanche - 5 jours.
export const getMondayOf = (date) => {
  const d = new Date(date);
  const dow = d.getDay(); // 0=dim … 6=sam
  // offset pour aller au mardi ISO de la même semaine
  // lun=1→+1, mar=2→0, mer=3→-1, jeu=4→-2, ven=5→-3, sam=6→-4, dim=0→-5
  const offsetToTuesday = dow === 0 ? -5 : 2 - dow;
  d.setDate(d.getDate() + offsetToTuesday - 1); // mardi puis -1 = lundi
  d.setHours(12, 0, 0, 0);
  return d;
};

export const dateOfSlot = (monday, dayIndex) => {
  const d = new Date(monday);
  d.setDate(monday.getDate() + dayIndex);
  d.setHours(12, 0, 0, 0);
  return d.toISOString().split("T")[0];
};
