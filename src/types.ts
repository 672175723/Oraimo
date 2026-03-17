export interface Review {
  id: string;
  user: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  tag?: string;
  description?: string;
  rating: number;
  reviewCount: number;
  features: string[];
  images?: string[];
  reviews?: Review[];
}

export interface Category {
  name: string;
  image: string;
  link: string;
  size?: 'large' | 'small';
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  city: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
}

export interface SiteSettings {
  primaryColor: string;
  secondaryColor: string;
  phone: string;
  whatsapp: string;
  email: string;
  siteName: string;
  seoTitle: string;
  seoDescription: string;
  heroBanners?: {
    image: string;
    title: string;
    subtitle: string;
    cta: string;
    link?: string;
  }[];
  // Typography
  fontFamily?: string;
  letterSpacing?: string;
  fontWeightText?: string;
  fontWeightNumbers?: string;
  // Number Formatting
  thousandsSeparator?: string;
  decimalPlaces?: number;
  currencySymbol?: string;
  currencyPosition?: 'prefix' | 'suffix';
  // System
  apiKey?: string;
  smtpServer?: string;
  isMaintenanceMode?: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'superadmin';
  status: 'active' | 'suspended';
  createdAt: any;
}

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "oraimo FreePods 4 - Écouteurs Sans Fil True Wireless",
    price: 24900,
    originalPrice: 35000,
    image: "https://picsum.photos/seed/freepods4/600/600",
    category: "Audio",
    tag: "HOT",
    rating: 4.8,
    reviewCount: 1240,
    features: ["Réduction active du bruit", "Audio spatial", "35.5 heures d'autonomie"],
    description: "Les FreePods 4 offrent une réduction active du bruit de pointe et un son spatial immersif pour une expérience d'écoute inégalée."
  },
  {
    id: "2",
    name: "oraimo Watch 4 Plus - Montre Connectée Appel Bluetooth",
    price: 29900,
    originalPrice: 45000,
    image: "https://picsum.photos/seed/watch4plus/600/600",
    category: "Wearable",
    tag: "NOUVEAU",
    rating: 4.9,
    reviewCount: 850,
    features: ["Écran HD 2.01''", "Appel Bluetooth", "100+ modes sportifs"]
  },
  {
    id: "3",
    name: "oraimo Toast 10 Flash - Batterie Externe 10000mAh",
    price: 12900,
    originalPrice: 18000,
    image: "https://picsum.photos/seed/toast10/600/600",
    category: "Power",
    tag: "OFFRE",
    rating: 4.7,
    reviewCount: 2100,
    features: ["Charge rapide 22.5W", "Design ultra-mince", "Double sortie USB"]
  },
  {
    id: "4",
    name: "oraimo SpaceBuds Neo - Audio Spatial Immersif",
    price: 19900,
    originalPrice: 28000,
    image: "https://picsum.photos/seed/spacebuds/600/600",
    category: "Audio",
    tag: "HOT",
    rating: 4.6,
    reviewCount: 420,
    features: ["Audio spatial", "40h d'autonomie", "Suppression du bruit"]
  },
  {
    id: "5",
    name: "oraimo Cordless Stick Vacuum Cleaner",
    price: 85000,
    originalPrice: 120000,
    image: "https://picsum.photos/seed/vacuum/600/600",
    category: "Home Appliances",
    tag: "NOUVEAU",
    rating: 4.5,
    reviewCount: 150,
    features: ["Aspiration puissante", "Autonomie longue durée", "Filtre HEPA"]
  },
  {
    id: "6",
    name: "oraimo SmartDent C2 Smart Electric Toothbrush",
    price: 8500,
    originalPrice: 12500,
    image: "https://picsum.photos/seed/toothbrush/600/600",
    category: "Personal Care",
    tag: "BEST SELLER",
    rating: 4.8,
    reviewCount: 320,
    features: ["5 modes de brossage", "Minuterie intelligente", "30 jours d'autonomie"]
  },
  {
    id: "7",
    name: "SpaceBox oraimo",
    price: 13500,
    originalPrice: 18000,
    image: "speaker-spacebox-obs-382-1.jpg",
    category: "Audio",
    tag: "NOUVEAU",
    rating: 4.9,
    reviewCount: 15,
    features: [
      "Taille : 146 * 72 * 50 mm",
      "Poids : 280 g",
      "Version Bluetooth : V5.4",
      "Capacité de la batterie : 1 800 mAh/3,7 V",
      "Autonomie : 5 h (volume max.), 16 h (volume moyen)",
      "Sortie audio : 8 W",
      "Mode de lecture : BT, carte TF, radio FM"
    ],
    description: "Modèle : OBS-382. Un haut-parleur Bluetooth compact et puissant avec une autonomie exceptionnelle et plusieurs modes de lecture."
  },
  {
    id: "8",
    name: "watch 5 max oraimo",
    price: 24500,
    originalPrice: 35000,
    image: "montre_connecte_otaimo_x_thahil.jpg",
    category: "Wearable",
    tag: "PREMIUM",
    rating: 5.0,
    reviewCount: 8,
    features: [
      "Écran 2.2'' AMOLED",
      "Appel Bluetooth",
      "GPS intégré",
      "150+ modes sportifs",
      "Édition collaborative Burna Boy"
    ],
    description: "La montre connectée ultime avec un écran AMOLED géant et des fonctionnalités de suivi de santé avancées."
  }
];

export const CATEGORIES: Category[] = [
  { name: "Audio", image: "https://picsum.photos/seed/audio-cat/600/600", link: "/collections/audio", size: 'large' },
  { name: "Power", image: "https://picsum.photos/seed/power-cat/400/400", link: "/collections/power", size: 'small' },
  { name: "Montre et bureau", image: "https://picsum.photos/seed/watch-cat/400/400", link: "/collections/wearable", size: 'small' },
  { name: "Appareils électroménagers", image: "https://picsum.photos/seed/home-cat/400/400", link: "/collections/home-appliances", size: 'small' },
  { name: "Soins personnels", image: "https://picsum.photos/seed/care-cat/400/400", link: "/collections/personal-care", size: 'small' }
];
