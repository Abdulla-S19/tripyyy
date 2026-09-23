export type City = { name: string; region: string; lat: number; lng: number; aka?: string[] };

export const CITIES: City[] = [
  { name: "Trivandrum", region: "Kerala", lat: 8.5241, lng: 76.9366, aka: ["Thiruvananthapuram", "TVM"] },
  { name: "Kochi", region: "Kerala", lat: 9.9312, lng: 76.2673, aka: ["Cochin", "Ernakulam"] },
  { name: "Kozhikode", region: "Kerala", lat: 11.2588, lng: 75.7804, aka: ["Calicut"] },
  { name: "Thrissur", region: "Kerala", lat: 10.5276, lng: 76.2144 },
  { name: "Alleppey", region: "Kerala", lat: 9.4981, lng: 76.3388, aka: ["Alappuzha"] },
  { name: "Munnar", region: "Kerala", lat: 10.0889, lng: 77.0595 },
  { name: "Thekkady", region: "Kerala", lat: 9.6031, lng: 77.1615, aka: ["Kumily"] },
  { name: "Wayanad", region: "Kerala", lat: 11.6854, lng: 76.132, aka: ["Kalpetta"] },
  { name: "Varkala", region: "Kerala", lat: 8.7379, lng: 76.7163 },
  { name: "Kovalam", region: "Kerala", lat: 8.4004, lng: 76.9787 },
  { name: "Kannur", region: "Kerala", lat: 11.8745, lng: 75.3704 },
  { name: "Kollam", region: "Kerala", lat: 8.8932, lng: 76.6141 },
  { name: "Palakkad", region: "Kerala", lat: 10.7867, lng: 76.6548 },
  { name: "Vagamon", region: "Kerala", lat: 9.6862, lng: 76.9052 },
  { name: "Ooty", region: "Tamil Nadu", lat: 11.4102, lng: 76.695, aka: ["Udhagamandalam"] },
  { name: "Coonoor", region: "Tamil Nadu", lat: 11.3530, lng: 76.7959 },
  { name: "Kodaikanal", region: "Tamil Nadu", lat: 10.2381, lng: 77.4892 },
  { name: "Chennai", region: "Tamil Nadu", lat: 13.0827, lng: 80.2707, aka: ["Madras"] },
  { name: "Coimbatore", region: "Tamil Nadu", lat: 11.0168, lng: 76.9558 },
  { name: "Madurai", region: "Tamil Nadu", lat: 9.9252, lng: 78.1198 },
  { name: "Pondicherry", region: "Puducherry", lat: 11.9416, lng: 79.8083, aka: ["Puducherry"] },
  { name: "Kanyakumari", region: "Tamil Nadu", lat: 8.0883, lng: 77.5385 },
  { name: "Rameswaram", region: "Tamil Nadu", lat: 9.2876, lng: 79.3129 },
  { name: "Mahabalipuram", region: "Tamil Nadu", lat: 12.6208, lng: 80.1945, aka: ["Mamallapuram"] },
  { name: "Yercaud", region: "Tamil Nadu", lat: 11.7753, lng: 78.2093 },
  { name: "Bengaluru", region: "Karnataka", lat: 12.9716, lng: 77.5946, aka: ["Bangalore"] },
  { name: "Mysuru", region: "Karnataka", lat: 12.2958, lng: 76.6394, aka: ["Mysore"] },
  { name: "Coorg", region: "Karnataka", lat: 12.4244, lng: 75.7382, aka: ["Madikeri", "Kodagu"] },
  { name: "Chikmagalur", region: "Karnataka", lat: 13.3161, lng: 75.772, aka: ["Chikkamagaluru"] },
  { name: "Hampi", region: "Karnataka", lat: 15.335, lng: 76.46 },
  { name: "Gokarna", region: "Karnataka", lat: 14.5479, lng: 74.3188 },
  { name: "Mangaluru", region: "Karnataka", lat: 12.9141, lng: 74.856, aka: ["Mangalore"] },
  { name: "Udupi", region: "Karnataka", lat: 13.3409, lng: 74.7421 },
  { name: "Hyderabad", region: "Telangana", lat: 17.385, lng: 78.4867 },
  { name: "Visakhapatnam", region: "Andhra Pradesh", lat: 17.6868, lng: 83.2185, aka: ["Vizag"] },
  { name: "Tirupati", region: "Andhra Pradesh", lat: 13.6288, lng: 79.4192 },
  { name: "Goa", region: "Goa", lat: 15.4909, lng: 73.8278, aka: ["Panaji", "Panjim"] },
  { name: "Mumbai", region: "Maharashtra", lat: 19.076, lng: 72.8777, aka: ["Bombay"] },
  { name: "Pune", region: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { name: "Lonavala", region: "Maharashtra", lat: 18.7546, lng: 73.4062 },
  { name: "Mahabaleshwar", region: "Maharashtra", lat: 17.9237, lng: 73.6586 },
  { name: "Aurangabad", region: "Maharashtra", lat: 19.8762, lng: 75.3433, aka: ["Chhatrapati Sambhajinagar", "Ajanta", "Ellora"] },
  { name: "Ahmedabad", region: "Gujarat", lat: 23.0225, lng: 72.5714 },
  { name: "Kutch", region: "Gujarat", lat: 23.242, lng: 69.6669, aka: ["Bhuj", "Rann of Kutch"] },
  { name: "Jaipur", region: "Rajasthan", lat: 26.9124, lng: 75.7873 },
  { name: "Udaipur", region: "Rajasthan", lat: 24.5854, lng: 73.7125 },
  { name: "Jodhpur", region: "Rajasthan", lat: 26.2389, lng: 73.0243 },
  { name: "Jaisalmer", region: "Rajasthan", lat: 26.9157, lng: 70.9083 },
  { name: "Pushkar", region: "Rajasthan", lat: 26.4897, lng: 74.5511 },
  { name: "Delhi", region: "Delhi", lat: 28.6139, lng: 77.209, aka: ["New Delhi"] },
  { name: "Agra", region: "Uttar Pradesh", lat: 27.1767, lng: 78.0081 },
  { name: "Varanasi", region: "Uttar Pradesh", lat: 25.3176, lng: 82.9739, aka: ["Banaras", "Kashi"] },
  { name: "Rishikesh", region: "Uttarakhand", lat: 30.0869, lng: 78.2676 },
  { name: "Haridwar", region: "Uttarakhand", lat: 29.9457, lng: 78.1642 },
  { name: "Mussoorie", region: "Uttarakhand", lat: 30.4598, lng: 78.0644 },
  { name: "Nainital", region: "Uttarakhand", lat: 29.3919, lng: 79.4542 },
  { name: "Shimla", region: "Himachal Pradesh", lat: 31.1048, lng: 77.1734 },
  { name: "Manali", region: "Himachal Pradesh", lat: 32.2432, lng: 77.1892 },
  { name: "Dharamshala", region: "Himachal Pradesh", lat: 32.219, lng: 76.3234, aka: ["McLeod Ganj"] },
  { name: "Kasol", region: "Himachal Pradesh", lat: 32.0099, lng: 77.3148 },
  { name: "Spiti", region: "Himachal Pradesh", lat: 32.2276, lng: 78.0718, aka: ["Kaza"] },
  { name: "Amritsar", region: "Punjab", lat: 31.634, lng: 74.8723 },
  { name: "Leh", region: "Ladakh", lat: 34.1526, lng: 77.5771, aka: ["Ladakh"] },
  { name: "Srinagar", region: "Jammu & Kashmir", lat: 34.0837, lng: 74.7973 },
  { name: "Gulmarg", region: "Jammu & Kashmir", lat: 34.0484, lng: 74.3805 },
  { name: "Kolkata", region: "West Bengal", lat: 22.5726, lng: 88.3639, aka: ["Calcutta"] },
  { name: "Darjeeling", region: "West Bengal", lat: 27.041, lng: 88.2663 },
  { name: "Gangtok", region: "Sikkim", lat: 27.3389, lng: 88.6065 },
  { name: "Shillong", region: "Meghalaya", lat: 25.5788, lng: 91.8933 },
  { name: "Guwahati", region: "Assam", lat: 26.1445, lng: 91.7362 },
  { name: "Kaziranga", region: "Assam", lat: 26.5775, lng: 93.1711 },
  { name: "Puri", region: "Odisha", lat: 19.8135, lng: 85.8312 },
  { name: "Bhubaneswar", region: "Odisha", lat: 20.2961, lng: 85.8245 },
  { name: "Khajuraho", region: "Madhya Pradesh", lat: 24.8318, lng: 79.9199 },
  { name: "Andaman", region: "Andaman & Nicobar", lat: 11.6234, lng: 92.7265, aka: ["Port Blair", "Havelock"] },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

export function findCity(name: string): City | undefined {
  const q = norm(name);
  if (!q) return undefined;
  return CITIES.find((c) => [c.name, ...(c.aka ?? [])].some((n) => norm(n) === q));
}

export function searchCities(query: string, exclude: string[] = [], limit = 6): City[] {
  const q = norm(query);
  const skip = new Set(exclude.map(norm));
  const pool = CITIES.filter((c) => !skip.has(norm(c.name)));
  if (!q) return pool.slice(0, limit);
  const scored = pool
    .map((c) => {
      const names = [c.name, ...(c.aka ?? [])].map(norm);
      const score = names.some((n) => n.startsWith(q))
        ? 0
        : names.some((n) => n.includes(q))
          ? 1
          : norm(c.region).startsWith(q)
            ? 2
            : -1;
      return { c, score };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((x) => x.c);
}
