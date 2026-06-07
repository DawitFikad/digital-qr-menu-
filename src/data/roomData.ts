import { Language } from "./translations";

export interface Room {
  id: string;
  type: 'standardRoom' | 'twinBed' | 'vipSuite';
  name: Record<Language, string>;
  description: Record<Language, string>;
  images: string[];
  amenities: string[];
  rating: number;
}

export const rooms: Room[] = [
  {
    id: "r1",
    type: "standardRoom",
    name: {
      en: "Standard Room",
      am: "መደበኛ ክፍል",
      or: "Kutaa Idilee"
    },
    description: {
      en: "Comfortable single bed room with all essential amenities and a modern workspace.",
      am: "ምቹ የሆነ የአንድ ሰው አልጋ ክፍል ከአስፈላጊ አገልግሎቶች ጋር።",
      or: "Kutaa algaa tokkoo tajaajila barbaachisaa waliin."
    },
    images: [
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=1200&auto=format&fit=crop"
    ],
    amenities: ["wifi", "hotShower", "roomService"],
    rating: 4.4
  },
  {
    id: "r2",
    type: "twinBed",
    name: {
      en: "Twin Bed Room",
      am: "መንትያ አልጋ ክፍል",
      or: "Kutaa Algaa Dachaa"
    },
    description: {
      en: "Spacious room with two separate premium beds, ideal for friends or family.",
      am: "ሁለት ለየብቻ አልጋዎች ያሉት ሰፊ ክፍል።",
      or: "Kutaa algaa lama qabu, hiriyootaa fi maatii dhaaf kan ta'u."
    },
    images: [
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544124499-58912cbddaad?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop"
    ],
    amenities: ["wifi", "hotShower", "roomService"],
    rating: 4.6
  },
  {
    id: "r3",
    type: "vipSuite",
    name: {
      en: "VIP Suite",
      am: "ቪአይፒ ስዊት",
      or: "VIP Suite"
    },
    description: {
      en: "Luxurious suite with premium features, a private lounge area, and panoramic views.",
      am: "ምርጥ እና ዘመናዊ ክፍል ከልዩ አገልግሎቶች ጋር።",
      or: "Kutaa qananii tajaajila addaa waliin."
    },
    images: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200&auto=format&fit=crop"
    ],
    amenities: ["wifi", "hotShower", "roomService"],
    rating: 5.0
  }
];
