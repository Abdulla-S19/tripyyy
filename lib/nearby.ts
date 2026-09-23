/** Popular day-trip spots around well-known destinations, offered as one-tap suggestions. */
const NEARBY: Record<string, string[]> = {
  ooty: ["Coonoor", "Pykara Falls", "Avalanche Lake", "Doddabetta Peak", "Kotagiri", "Emerald Lake", "Mudumalai"],
  coonoor: ["Ooty", "Dolphin's Nose", "Lamb's Rock", "Kotagiri", "Sim's Park"],
  munnar: ["Top Station", "Mattupetty Dam", "Eravikulam National Park", "Vattavada", "Attukad Falls", "Chinnar"],
  kodaikanal: ["Berijam Lake", "Pillar Rocks", "Poombarai", "Mannavanur", "Dolphin's Nose"],
  wayanad: ["Edakkal Caves", "Banasura Sagar", "Chembra Peak", "Kuruva Island", "Soochipara Falls", "Tholpetty"],
  alleppey: ["Kumarakom", "Marari Beach", "Kuttanad backwaters", "Pathiramanal"],
  kochi: ["Fort Kochi", "Cherai Beach", "Mattancherry", "Athirappilly Falls", "Hill Palace"],
  trivandrum: ["Kovalam", "Varkala", "Ponmudi", "Poovar", "Padmanabhaswamy Temple"],
  thekkady: ["Periyar Tiger Reserve", "Ramakkalmedu", "Gavi", "Vagamon"],
  coorg: ["Abbey Falls", "Dubare Elephant Camp", "Raja's Seat", "Talakaveri", "Mandalpatti", "Bylakuppe"],
  chikmagalur: ["Mullayanagiri", "Baba Budangiri", "Kudremukh", "Hebbe Falls", "Belur & Halebidu"],
  mysuru: ["Srirangapatna", "Chamundi Hills", "Brindavan Gardens", "Somnathpur", "Ranganathittu"],
  hampi: ["Anegundi", "Tungabhadra Dam", "Daroji Sloth Bear Sanctuary", "Badami"],
  goa: ["Old Goa", "Palolem", "Dudhsagar Falls", "Fontainhas", "Chapora Fort", "Divar Island"],
  pondicherry: ["Auroville", "Paradise Beach", "Mahabalipuram", "Pichavaram mangroves"],
  madurai: ["Rameswaram", "Kodaikanal", "Chettinad", "Alagar Kovil"],
  kanyakumari: ["Vivekananda Rock", "Padmanabhapuram Palace", "Suchindram", "Thiruparappu Falls"],
  manali: ["Solang Valley", "Atal Tunnel & Sissu", "Rohtang Pass", "Kasol", "Naggar", "Jibhi"],
  shimla: ["Kufri", "Chail", "Mashobra", "Naldehra", "Narkanda"],
  rishikesh: ["Haridwar", "Neer Garh Falls", "Kunjapuri Temple", "Shivpuri rafting"],
  jaipur: ["Amber Fort", "Nahargarh", "Sambhar Lake", "Abhaneri Stepwell", "Chokhi Dhani"],
  udaipur: ["Kumbhalgarh", "Ranakpur", "Chittorgarh", "Eklingji"],
  jaisalmer: ["Sam Sand Dunes", "Kuldhara", "Khuri", "Longewala"],
  darjeeling: ["Tiger Hill", "Mirik", "Kalimpong", "Batasia Loop"],
  gangtok: ["Tsomgo Lake", "Nathula Pass", "Rumtek Monastery", "Lachung"],
  leh: ["Pangong Lake", "Nubra Valley", "Khardung La", "Tso Moriri", "Lamayuru"],
  srinagar: ["Gulmarg", "Pahalgam", "Sonamarg", "Doodhpathri"],
  andaman: ["Havelock (Swaraj Dweep)", "Neil Island", "Ross Island", "Baratang"],
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
const ALIASES: Record<string, string> = { udhagamandalam: "ooty", mysore: "mysuru", cochin: "kochi", alappuzha: "alleppey", thiruvananthapuram: "trivandrum", puducherry: "pondicherry", madikeri: "coorg" };

export function nearbySuggestions(destination: string, exclude: string[] = []): string[] {
  const key = ALIASES[norm(destination)] ?? norm(destination);
  const skip = new Set(exclude.map(norm));
  return (NEARBY[key] ?? []).filter((p) => !skip.has(norm(p)));
}
