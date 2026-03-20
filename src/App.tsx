import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Search, 
  User, 
  ShoppingCart, 
  Heart, 
  Menu, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Truck, 
  Gift,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Smartphone,
  CreditCard,
  Banknote,
  X,
  MapPin,
  Star,
  Headset,
  Lock,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Share2,
  Zap,
  Settings,
  LayoutDashboard,
  Package,
  ClipboardList,
  LogOut,
  PlusCircle,
  Trash2,
  Edit3,
  ExternalLink,
  Eye,
  Globe,
  Palette,
  Phone,
  Mail,
  MessageCircle,
  AlertCircle,
  Upload,
  Printer,
  FileText,
  Loader2,
  ArrowUp,
  Check,
  UserX,
  UserCheck,
  Key,
  Type,
  Hash,
  TrendingUp,
  ShoppingBag,
  Clock,
  Users,
  BarChart2,
  Activity,
  ArrowUpRight,
  TrendingDown,
  Link as LinkIcon,
  Images
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { PRODUCTS as MOCK_PRODUCTS, CATEGORIES, Product, Review, Order, SiteSettings, UserProfile, CartItem } from './types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  getDocFromServer,
  increment,
  limit,
  where
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { db, auth } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Une erreur inattendue est survenue.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error && parsed.error.includes("insufficient permissions")) {
          errorMessage = "Vous n'avez pas les permissions nécessaires pour effectuer cette action.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <AlertCircle size={64} className="text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Oups !</h2>
            <p className="text-gray-600 font-bold mb-8">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-oraimo-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-oraimo-green transition-all"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const DynamicStyle = ({ settings }: { settings: SiteSettings }) => {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      :root {
        --primary-color: ${settings.primaryColor};
        --secondary-color: ${settings.secondaryColor};
        --font-family: ${settings.fontFamily || '"Inter", sans-serif'};
        --letter-spacing: ${settings.letterSpacing || 'normal'};
        --font-weight-text: ${settings.fontWeightText || '500'};
        --font-weight-numbers: ${settings.fontWeightNumbers || '900'};
      }
      body {
        font-family: var(--font-family);
        letter-spacing: var(--letter-spacing);
      }
      .font-text { font-weight: var(--font-weight-text); }
      .font-numbers { font-weight: var(--font-weight-numbers); }
      .text-oraimo-green { color: var(--primary-color); }
      .bg-oraimo-green { background-color: var(--primary-color); }
      .border-oraimo-green { border-color: var(--primary-color); }
      .ring-oraimo-green { --tw-ring-color: var(--primary-color); }
    `}} />
  );
};

// SEO Helper
const useSEO = (title: string, description: string, image?: string, product?: Product, keywords?: string) => {
  useEffect(() => {
    const fullTitle = `${title} | oraimo Cameroun`;
    const url = window.location.href;
    document.title = fullTitle;
    
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const updateCanonical = (href: string) => {
      let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    const updateJSONLD = (data: any) => {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(data);
    };

    updateMeta('description', description);
    if (keywords) updateMeta('keywords', keywords);
    updateMeta('og:title', fullTitle, true);
    updateMeta('og:description', description, true);
    updateMeta('og:url', url, true);
    updateMeta('og:type', product ? 'product' : 'website', true);
    if (image) updateMeta('og:image', image, true);

    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', description);
    if (image) updateMeta('twitter:image', image);

    updateCanonical(url);

    // Structured Data (JSON-LD)
    if (product) {
      const jsonLd = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": [product.image, ...(product.images || [])],
        "description": product.description || description,
        "sku": product.id,
        "brand": {
          "@type": "Brand",
          "name": "oraimo"
        },
        "offers": {
          "@type": "Offer",
          "url": url,
          "priceCurrency": "XAF",
          "price": product.price,
          "availability": "https://schema.org/InStock",
          "itemCondition": "https://schema.org/NewCondition"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": product.rating,
          "reviewCount": product.reviewCount
        }
      };
      updateJSONLD(jsonLd);
    } else {
      // General Website JSON-LD
      const websiteLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "oraimo Cameroun",
        "url": window.location.origin,
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${window.location.origin}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      };
      updateJSONLD(websiteLd);
    }
  }, [title, description, image, product]);
};

const EnregistrerButton = ({ onClick, label }: { onClick: () => Promise<void>, label: string }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  return (
    <button 
      onClick={async () => {
        setIsSubmitting(true);
        try {
          await onClick();
        } finally {
          setIsSubmitting(false);
        }
      }}
      disabled={isSubmitting}
      className="flex-1 bg-oraimo-green text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
    >
      {isSubmitting ? (
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={20} />
        </motion.div>
      ) : label}
    </button>
  );
};

// Image Upload Component
const ImageUploadField = ({ 
  label, 
  value, 
  onChange, 
  disabled = false,
  placeholder = "URL de l'image (Lien direct)"
}: { 
  label: string, 
  value: string, 
  onChange: (val: string) => void,
  disabled?: boolean,
  placeholder?: string
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          onChange(dataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-black uppercase tracking-widest text-gray-400">{label}</label>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            type="button"
            onClick={() => setUploadMode('url')}
            className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${uploadMode === 'url' ? 'bg-white text-oraimo-black shadow-sm' : 'text-gray-400'}`}
          >
            Lien URL
          </button>
          <button 
            type="button"
            onClick={() => setUploadMode('file')}
            className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${uploadMode === 'file' ? 'bg-white text-oraimo-black shadow-sm' : 'text-gray-400'}`}
          >
            Fichier
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {uploadMode === 'url' ? (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <LinkIcon size={14} />
              </div>
              <input 
                disabled={disabled}
                type="text" 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50 transition-all"
              />
            </div>
          </div>
        ) : (
          <div className="relative">
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              disabled={disabled}
              className="hidden"
            />
            <button 
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 hover:border-oraimo-green transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload size={24} className="text-gray-300" />
              <span className="text-xs font-bold uppercase tracking-widest">Choisir une image sur mon poste</span>
            </button>
          </div>
        )}

        {value && (
          <div className="relative w-full aspect-video bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group shadow-sm">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button 
                onClick={() => window.open(value, '_blank')}
                className="p-3 bg-white text-oraimo-black rounded-full hover:bg-gray-100 transition-colors shadow-lg"
              >
                <ExternalLink size={18} />
              </button>
              <button 
                onClick={() => onChange('')}
                className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Bulk Image Upload Component
const BulkImageUpload = ({ 
  label, 
  values, 
  onChange, 
  disabled = false 
}: { 
  label: string, 
  values: string[], 
  onChange: (vals: string[]) => void,
  disabled?: boolean
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      let loadedCount = 0;

      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          loadedCount++;
          if (loadedCount === files.length) {
            onChange([...values, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...values];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-xs font-black uppercase tracking-widest text-gray-400">{label}</label>
        <div className="relative">
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            disabled={disabled}
            className="hidden"
          />
          <button 
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-oraimo-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-oraimo-green transition-all disabled:opacity-50"
          >
            <Plus size={14} /> Importer plusieurs
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {values.map((img, idx) => (
          <div key={idx} className="relative group aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <img src={img} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={() => removeImage(idx)}
                className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
        <div 
          onClick={() => !disabled && fileInputRef.current?.click()}
          className="relative aspect-square border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center hover:border-oraimo-green transition-colors cursor-pointer group"
        >
          <Plus size={24} className="text-gray-300 group-hover:text-oraimo-green transition-colors" />
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentHero, setCurrentHero] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTopBanner, setShowTopBanner] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 30 });

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = (product: Product) => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Découvrez ${product.name} sur oraimo Cameroun !`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      showNotification('Lien copié dans le presse-papier !');
    }
  };
  
  const formatPrice = (price: number) => {
    const { 
      thousandsSeparator = ' ', 
      decimalPlaces = 0, 
      currencySymbol = 'FCFA', 
      currencyPosition = 'suffix' 
    } = settings;

    const formatted = price.toLocaleString('fr-FR', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).replace(/\s/g, thousandsSeparator);

    return currencyPosition === 'prefix' 
      ? `${currencySymbol} ${formatted}` 
      : `${formatted} ${currencySymbol}`;
  };

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [settings, setSettings] = useState<SiteSettings>({
    primaryColor: '#93C01F',
    secondaryColor: '#000000',
    phone: '+237 699 932 926',
    whatsapp: '+237699932926',
    email: 'joellmikamm@gmail.com',
    mtnNumber: '+237672175723',
    orangeNumber: '+237699932926',
    paypalEmail: 'joellmikamm@gmail.com',
    siteName: 'oraimo Cameroun',
    seoTitle: 'Boutique Officielle oraimo Cameroun | Accessoires Intelligents',
    seoDescription: 'Achetez des écouteurs, montres connectées, batteries externes et plus sur la boutique officielle oraimo au Cameroun. Livraison rapide et garantie officielle.',
    heroBanners: [
      {
        image: "https://picsum.photos/seed/audio/1920/1080",
        title: "Expérience Audio Ultime",
        subtitle: "Découvrez la nouvelle gamme SpaceBuds",
        cta: "Découvrir"
      },
      {
        image: "https://picsum.photos/seed/watch/1920/1080",
        title: "Style & Performance",
        subtitle: "Les meilleures montres connectées",
        cta: "Voir la collection"
      },
      {
        image: "https://picsum.photos/seed/power/1920/1080",
        title: "Énergie Sans Limite",
        subtitle: "Batteries externes haute capacité",
        cta: "Acheter"
      }
    ],
    fontFamily: '"Inter", sans-serif',
    letterSpacing: 'normal',
    fontWeightText: '500',
    fontWeightNumbers: '900',
    thousandsSeparator: ' ',
    decimalPlaces: 0,
    currencySymbol: 'FCFA',
    currencyPosition: 'suffix',
    isMaintenanceMode: false,
    paymentAggregator: 'none',
    campayAppId: '',
    campayAppSecret: '',
    cinetpayApiKey: '',
    cinetpaySiteId: ''
  });
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminLoginForm, setAdminLoginForm] = useState({ username: '', password: '' });
  const [adminLoginError, setAdminLoginError] = useState('');

  const handleManualAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLoginForm.username === 'joellmikamm@gmail.com' && adminLoginForm.password === 'oraimo2026@') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminLoginError('');
      showNotification('Connexion Super Administrateur réussie');
      navigate('/admin');
    } else {
      setAdminLoginError('Identifiants incorrects');
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      showNotification('Connexion réussie');
    } catch (error) {
      console.error(error);
      showNotification('Erreur de connexion', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAdmin(false);
      showNotification('Déconnexion réussie');
    } catch (error) {
      console.error(error);
      showNotification('Erreur de déconnexion', 'error');
    }
  };

  useSEO(
    settings.seoTitle, 
    settings.seoDescription, 
    settings.heroBanners?.[0]?.image,
    undefined,
    settings.seoKeywords
  );

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    // Real-time Products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (!snapshot.empty) {
        const productData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productData);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    // Real-time Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as SiteSettings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    });

    // Auth State
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Check if admin
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const isAdminEmail = currentUser.email === 'joellmikamm@gmail.com';
          
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', currentUser.uid), {
              name: currentUser.displayName || 'Utilisateur',
              email: currentUser.email,
              role: isAdminEmail ? 'admin' : 'user',
              createdAt: serverTimestamp()
            });
          }
          
          const isAdminUser = isAdminEmail || (userDoc.exists() && userDoc.data().role === 'admin');
          setIsAdmin(isAdminUser);
          
          if (isAdminUser) {
            showNotification('Mode administrateur activé');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
      } else {
        // Only reset isAdmin if we are not in manual login mode
        // But wait, manual login doesn't set Firebase Auth user.
        // So if user is null, and we are not manually logged in, then isAdmin = false.
        // Let's check if we have a manual login session (we don't have a persistent one yet).
        setIsAdmin(false);
      }
    });

    return () => {
      unsubProducts();
      unsubSettings();
      unsubAuth();
    };
  }, []);

  const hasTrackedVisit = useRef(false);

  // Track traffic
  useEffect(() => {
    const trackVisit = async () => {
      if (hasTrackedVisit.current && !user) return; // Only track once per session, unless user logs in
      
      const today = new Date().toISOString().split('T')[0];
      const statsRef = doc(db, 'stats', today);
      
      // Determine source
      let source = 'Direct';
      const referrer = document.referrer;
      if (referrer) {
        if (referrer.includes('facebook.com')) source = 'Facebook';
        else if (referrer.includes('google.com')) source = 'Google';
        else if (referrer.includes('instagram.com')) source = 'Instagram';
        else if (referrer.includes('t.co') || referrer.includes('twitter.com')) source = 'Twitter';
        else {
          try {
            source = new URL(referrer).hostname;
          } catch (e) {
            source = 'Autre';
          }
        }
      }

      // Determine location (IP-based)
      let locationData = { city: 'Inconnu', country: 'Inconnu', region: 'Inconnu' };
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          locationData = {
            city: data.city || 'Inconnu',
            country: data.country_name || 'Inconnu',
            region: data.region || 'Inconnu'
          };
        }
      } catch (e) {
        console.error("Error fetching location:", e);
      }

      // Determine demographics (if logged in)
      let demographicKey = 'Anonyme';
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const age = userData.age || 'Inconnu';
            const gender = userData.gender || 'Inconnu';
            demographicKey = `${gender}_${age}`;
          }
        } catch (e) {
          console.error("Error fetching user demographics:", e);
        }
      }

      try {
        const updates: any = {
          date: today,
          [`sources.${source.replace(/\./g, '_')}`]: increment(1),
          [`locations.${locationData.country.replace(/\./g, '_')}_${locationData.city.replace(/\./g, '_')}`]: increment(1),
          [`demographics.${demographicKey.replace(/\./g, '_')}`]: increment(1)
        };
        
        // Only increment total visits once
        if (!hasTrackedVisit.current) {
          updates.visits = increment(1);
          hasTrackedVisit.current = true;
        }
        
        await setDoc(statsRef, updates, { merge: true });
      } catch (e) {
        console.error("Error tracking visit:", e);
      }
    };
    trackVisit();
  }, [user]);

  const addToCart = async (product: Product, quantity: number = 1, color?: string) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id && item.color === color);
      if (existing) {
        return prev.map(item => (item.id === product.id && item.color === color) ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity, color }];
    });
    setIsCartOpen(true);
    
    // Track cart activity
    const today = new Date().toISOString().split('T')[0];
    const statsRef = doc(db, 'stats', today);
    try {
      await setDoc(statsRef, {
        cartAdds: increment(quantity),
        date: today
      }, { merge: true });
    } catch (e) {
      console.error("Error tracking cart add:", e);
    }
  };

  const updateQuantity = (productId: string, delta: number, color?: string) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === productId && item.color === color) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string, color?: string) => {
    setCartItems(prev => prev.filter(item => !(item.id === productId && item.color === color)));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroBanners.length);
    }, 6000);

    const countdown = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(countdown);
    };
  }, []);

  const heroBanners = settings.heroBanners || [];

  const isAdminPage = location.pathname === '/admin';

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-oraimo-green selection:text-white bg-white">
      <DynamicStyle settings={settings} />
      {/* App Download Banner */}
      <AnimatePresence>
        {showTopBanner && !isAdminPage && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="bg-[#F8F8F8] overflow-hidden border-b border-gray-200"
          >
            <div className="container py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowTopBanner(false)} className="text-gray-400 hover:text-black">
                  <X size={16} />
                </button>
                <div className="w-10 h-10 bg-oraimo-black rounded-lg flex items-center justify-center text-white font-black text-xs italic">
                  o.
                </div>
                <div>
                  <p className="text-[13px] font-bold leading-tight">oraimo store</p>
                  <p className="text-[11px] text-gray-500">Achetez plus facilement sur l'APP</p>
                </div>
              </div>
              <button className="bg-oraimo-green text-white text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                Obtenir
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      {!isAdminPage && (
        <div className="bg-oraimo-black text-white py-2.5 overflow-hidden whitespace-nowrap">
          <div className="flex animate-[marquee_30s_linear_infinite] gap-16 items-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.1em]">Livraison gratuite à partir de 10,000 FCFA</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em]">Garantie officielle de 12 mois</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em]">Paiement à la livraison disponible</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em]">Livraison gratuite à partir de 10,000 FCFA</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em]">Garantie officielle de 12 mois</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.1em]">Paiement à la livraison disponible</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="container h-16 md:h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="block group">
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-oraimo-black italic flex items-baseline">
                oraimo<span style={{ color: settings.primaryColor }} className="text-5xl leading-[0] ml-0.5 group-hover:animate-pulse">.</span>
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-10">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'text-oraimo-green' : ''}`}>Accueil</Link>
            <Link to="/collections/all" className={`nav-link ${location.pathname === '/collections/all' ? 'text-oraimo-green' : ''}`}>Boutique</Link>
            <div className="group relative">
              <a href="#" className="nav-link flex items-center gap-1">Produits <ChevronDown size={14} /></a>
              <div className="absolute top-full left-0 bg-white shadow-2xl rounded-xl p-8 w-[400px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all border border-gray-100 grid grid-cols-2 gap-6">
                {CATEGORIES.map(cat => (
                  <Link key={cat.name} to={cat.link} className="text-[13px] font-bold hover:text-oraimo-green transition-colors flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden">
                      <img src={cat.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
            <a href="#flash-sale" className="nav-link">Flash Sale</a>
            <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'text-oraimo-green' : ''}`}>Admin</Link>
            <a href="#" className="nav-link text-oraimo-green flex items-center gap-1">
              <Gift size={16} /> O-Club
            </a>
          </nav>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="w-full bg-[#F5F5F5] border border-transparent hover:border-oraimo-green/30 rounded-full px-6 py-2.5 flex items-center gap-3 text-gray-400 cursor-pointer transition-all"
            >
              <Search size={18} />
              <span className="text-[13px] font-medium">Rechercher des produits...</span>
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-1 md:gap-3">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 hover:text-oraimo-green transition-colors"
            >
              <Search size={22} strokeWidth={2} />
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2 hover:text-oraimo-green transition-colors relative"
            >
              <ShoppingCart size={22} strokeWidth={2} />
              <span className="absolute top-1 right-1 bg-oraimo-green text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartItems.length}</span>
            </button>
            <button 
              onClick={() => {
                if (user) {
                  handleLogout();
                } else {
                  handleGoogleLogin();
                }
              }}
              className="p-2 hover:text-oraimo-green transition-colors flex items-center gap-2"
              title={user ? "Déconnexion" : "Connexion"}
            >
              <User size={22} strokeWidth={2} />
              {user && <span className="hidden lg:block text-[10px] font-bold uppercase tracking-widest">{user.displayName?.split(' ')[0]}</span>}
            </button>
            <button 
              className="lg:hidden p-2"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu size={22} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[100] flex flex-col"
          >
            <div className="container py-6 flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Rechercher des produits..." 
                  className="w-full bg-gray-100 rounded-full py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-oraimo-green transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button onClick={() => setIsSearchOpen(false)} className="text-sm font-bold uppercase tracking-wider">
                Annuler
              </button>
            </div>
            <div className="container flex-grow overflow-y-auto py-8">
              {searchQuery ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      settings={settings}
                      formatPrice={formatPrice}
                      onClick={() => { navigate(`/product/${product.id}`); setIsSearchOpen(false); }} 
                      onAddToCart={(e) => { e.stopPropagation(); addToCart(product); }}
                      onBuyNow={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`, { state: { openOrderForm: true } }); setIsSearchOpen(false); }}
                    />
                  ))}
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Recherches populaires</h3>
                  <div className="flex flex-wrap gap-3">
                    {['SpaceBuds', 'Watch Nova', 'Power Bank', 'FreePods'].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="bg-gray-100 px-4 py-2 rounded-full text-sm font-bold hover:bg-oraimo-green hover:text-white transition-all"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back to Top Button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 w-12 h-12 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center shadow-lg z-50 hover:bg-black/60 transition-all"
      >
        <ArrowUp size={24} />
      </button>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 z-[110] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[90%] max-w-md bg-white z-[120] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-tight">Mon Panier ({cartItems.length})</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:text-oraimo-green transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-6">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6">
                      <ShoppingCart size={40} />
                    </div>
                    <p className="text-gray-500 font-bold mb-8">Votre panier est vide</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="bg-oraimo-green text-white px-8 py-3 rounded-full font-bold uppercase tracking-wider"
                    >
                      Continuer mes achats
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div 
                          onClick={() => {
                            navigate(`/product/${item.id}`);
                            setIsCartOpen(false);
                          }}
                          className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 p-2 cursor-pointer hover:bg-gray-200 transition-colors"
                        >
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-sm font-bold text-oraimo-black line-clamp-1">{item.name}</h4>
                          {item.color && (
                            <div className="flex items-center gap-1 mt-1">
                              <div className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: item.color }} />
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.color}</span>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mb-2">{item.category}</p>
                          <div className="flex justify-between items-center">
                            <span className="font-black text-sm">{formatPrice(item.price * item.quantity)}</span>
                            <div className="flex items-center gap-3 border border-gray-200 rounded-full px-2 py-1">
                              <button 
                                onClick={() => updateQuantity(item.id, -1, item.color)}
                                className="text-gray-400 hover:text-oraimo-green"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-xs font-bold">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, 1, item.color)}
                                className="text-gray-400 hover:text-oraimo-green"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id, item.color)}
                            className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-2 hover:underline"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cartItems.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-500 font-bold">Total</span>
                    <span className="text-2xl font-black text-oraimo-black">
                      {formatPrice(cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0))}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full bg-oraimo-green text-white py-4 rounded-full font-black uppercase tracking-widest shadow-xl shadow-oraimo-green/20"
                  >
                    Passer à la caisse
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[80%] max-w-sm bg-white z-[70] shadow-2xl overflow-y-auto"
            >
              <div className="p-8">
                <div className="mb-12">
                  <h2 className="text-3xl font-black italic tracking-tighter">oraimo<span className="text-oraimo-green">.</span></h2>
                </div>

                <div className="flex flex-col gap-8">
                  <button 
                    onClick={() => { navigate('/'); setIsMenuOpen(false); }} 
                    className="text-left text-2xl font-bold text-oraimo-green"
                  >
                    Accueil
                  </button>
                  <button 
                    onClick={() => { 
                      const el = document.getElementById('flash-sale');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      setIsMenuOpen(false); 
                    }} 
                    className="text-left text-2xl font-bold text-oraimo-black"
                  >
                    Flash Sale
                  </button>

                  <div className="mt-4">
                    <p className="text-[13px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">
                      Catégories
                    </p>
                    <div className="flex flex-col gap-6">
                      {CATEGORIES.map((cat) => (
                        <button 
                          key={cat.name} 
                          onClick={() => { navigate(cat.link); setIsMenuOpen(false); }}
                          className="text-left text-xl font-bold text-oraimo-black"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-gray-100">
                    <button 
                      onClick={() => { navigate('/admin'); setIsMenuOpen(false); }}
                      className="flex items-center gap-3 text-gray-400 font-bold uppercase tracking-widest text-[11px]"
                    >
                      <Lock size={14} /> Administration
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={
            <>
              {/* Hero Slider */}
              <section className="relative h-[400px] md:h-[600px] overflow-hidden bg-gray-100">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentHero}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                  >
                    <div 
                      className="absolute inset-0 cursor-pointer"
                      onClick={() => {
                        if (heroBanners[currentHero].link) {
                          if (heroBanners[currentHero].link.startsWith('http')) {
                            window.open(heroBanners[currentHero].link, '_blank');
                          } else {
                            navigate(heroBanners[currentHero].link);
                          }
                        }
                      }}
                    >
                      <img 
                        src={heroBanners[currentHero].image} 
                        alt={heroBanners[currentHero].title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 flex items-center">
                      <div className="container">
                        <motion.div 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.6 }}
                          className="max-w-xl"
                        >
                          <h2 className="text-4xl md:text-6xl font-black mb-4 uppercase tracking-tight leading-tight">
                            {heroBanners[currentHero].title}
                          </h2>
                          <p className="text-lg md:text-xl mb-8 text-gray-700 font-medium">
                            {heroBanners[currentHero].subtitle}
                          </p>
                          <button 
                            onClick={() => {
                              if (heroBanners[currentHero].link) {
                                if (heroBanners[currentHero].link.startsWith('http')) {
                                  window.open(heroBanners[currentHero].link, '_blank');
                                } else {
                                  navigate(heroBanners[currentHero].link);
                                }
                              }
                            }}
                            style={{ backgroundColor: settings.primaryColor }} 
                            className="text-white px-8 py-3 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-opacity-90 transition-all shadow-lg"
                          >
                            {heroBanners[currentHero].cta}
                          </button>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                </AnimatePresence>
                
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {heroBanners.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentHero(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${currentHero === idx ? 'w-8' : 'bg-gray-300 w-4'}`}
                      style={{ backgroundColor: currentHero === idx ? settings.primaryColor : undefined }}
                    />
                  ))}
                </div>
              </section>

              {/* Trust Badges */}
              <section className="py-12 bg-white border-b border-gray-100">
                <div className="container">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="flex items-center gap-5 group">
                      <div className="w-14 h-14 bg-[#F8F8F8] rounded-2xl flex items-center justify-center text-oraimo-green group-hover:bg-oraimo-green group-hover:text-white transition-all duration-500">
                        <ShieldCheck size={28} />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-black uppercase tracking-tight italic">Garantie sans tracas</h4>
                        <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Service après-vente officiel</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 group">
                      <div className="w-14 h-14 bg-[#F8F8F8] rounded-2xl flex items-center justify-center text-oraimo-green group-hover:bg-oraimo-green group-hover:text-white transition-all duration-500">
                        <Truck size={28} />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-black uppercase tracking-tight italic">Livraison gratuite</h4>
                        <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">À partir de {formatPrice(10000)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 group">
                      <div className="w-14 h-14 bg-[#F8F8F8] rounded-2xl flex items-center justify-center text-oraimo-green group-hover:bg-oraimo-green group-hover:text-white transition-all duration-500">
                        <CheckCircle size={28} />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-black uppercase tracking-tight italic">100% Original</h4>
                        <p className="text-[12px] text-gray-400 font-bold uppercase tracking-wider">Produits authentiques</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Flash Sale */}
              <section id="flash-sale" className="py-16 bg-white">
                <div className="container">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 bg-[#F8F8F8] p-8 rounded-3xl">
                    <div className="flex flex-col md:flex-row md:items-center gap-8">
                      <div className="flex items-center gap-3">
                        <div style={{ backgroundColor: settings.primaryColor }} className="w-10 h-10 rounded-xl flex items-center justify-center text-white">
                          <Zap size={24} fill="currentColor" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic">Vente Flash</h2>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Finit dans:</span>
                        <div className="flex gap-2">
                          <div className="bg-oraimo-black text-white w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg">
                            {String(timeLeft.hours).padStart(2, '0')}
                          </div>
                          <span className="text-oraimo-black font-black text-xl">:</span>
                          <div className="bg-oraimo-black text-white w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg">
                            {String(timeLeft.minutes).padStart(2, '0')}
                          </div>
                          <span className="text-oraimo-black font-black text-xl">:</span>
                          <div className="bg-oraimo-black text-white w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg">
                            {String(timeLeft.seconds).padStart(2, '0')}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="text-sm font-black uppercase tracking-widest text-oraimo-black border-b-2 border-oraimo-black pb-1 hover:text-oraimo-green hover:border-oraimo-green transition-all">
                      Voir tout
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {products.slice(0, 4).map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        isFlashSale={true}
                        settings={settings}
                        formatPrice={formatPrice}
                        onClick={() => navigate(`/product/${product.id}`)}
                        onAddToCart={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        onBuyNow={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.id}`, { state: { openOrderForm: true } });
                        }}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* Category Grid */}
              <section className="py-10 bg-white">
                <div className="container">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Large Category */}
                    <div 
                      onClick={() => navigate(CATEGORIES[0].link)}
                      className="relative group overflow-hidden rounded-2xl aspect-[4/3] md:aspect-auto md:h-full cursor-pointer"
                    >
                      <img 
                        src={CATEGORIES[0].image} 
                        alt={CATEGORIES[0].name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black/40 to-transparent">
                        <h3 className="text-3xl font-black text-white uppercase mb-4">{CATEGORIES[0].name}</h3>
                        <div className="text-white font-bold flex items-center gap-2 group/link">
                          Acheter maintenant <ArrowRight size={18} className="group-hover/link:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>

                    {/* Small Categories Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {CATEGORIES.slice(1).map((cat) => (
                        <div 
                          key={cat.name} 
                          onClick={() => navigate(cat.link)}
                          className="relative group overflow-hidden rounded-2xl aspect-square cursor-pointer"
                        >
                          <img 
                            src={cat.image} 
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black/40 to-transparent">
                            <h3 className="text-sm md:text-lg font-black text-white uppercase leading-tight">{cat.name}</h3>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* New Arrivals */}
              <section id="new-arrivals" className="py-12 bg-white">
                <div className="container">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Nouveautés</h2>
                    <a href="#" className="text-oraimo-green font-bold text-sm flex items-center gap-1">
                      Voir tout <ChevronRight size={16} />
                    </a>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {products.slice(0, 4).map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        settings={settings}
                        formatPrice={formatPrice}
                        onClick={() => navigate(`/product/${product.id}`)} 
                        onAddToCart={(e) => { e.stopPropagation(); addToCart(product); }} 
                        onBuyNow={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`, { state: { openOrderForm: true } }); }}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* Recommendations */}
              <section id="recommendations" className="py-12 bg-white">
                <div className="container">
                  <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Recommandation</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        settings={settings}
                        formatPrice={formatPrice}
                        onClick={() => navigate(`/product/${product.id}`)} 
                        onAddToCart={(e) => { e.stopPropagation(); addToCart(product); }} 
                        onBuyNow={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`, { state: { openOrderForm: true } }); }}
                      />
                    ))}
                  </div>
                </div>
              </section>
            </>
          } />
          <Route path="/product/:id" element={<ProductDetailPage products={products} onAddToCart={addToCart} settings={settings} showNotification={showNotification} handleShare={handleShare} formatPrice={formatPrice} />} />
          <Route path="/collections/:category" element={<CategoryPage products={products} addToCart={addToCart} settings={settings} formatPrice={formatPrice} />} />
          <Route path="/admin" element={<AdminDashboard products={products} settings={settings} showNotification={showNotification} isAdmin={isAdmin} user={user} formatPrice={formatPrice} categories={CATEGORIES} />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-[#F8F8F8] pt-20 pb-10">
        <div className="container">
          {/* Newsletter Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center pb-16 border-b border-gray-200 mb-16">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2 italic">Rejoignez la famille oraimo</h3>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">Inscrivez-vous pour recevoir les dernières offres et actualités.</p>
            </div>
            <div className="flex gap-3">
              <input 
                type="email" 
                placeholder="Votre adresse e-mail" 
                className="flex-1 bg-white border border-gray-200 rounded-xl px-6 py-4 text-sm focus:outline-none focus:border-oraimo-green transition-colors font-bold"
              />
              <button className="bg-oraimo-black text-white px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-oraimo-green transition-all">
                S'abonner
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <FooterColumn title="Service client" links={["Points de service", "Politique de garantie", "Expédition et livraison", "Retours et échanges"]} />
            <div className="flex flex-col gap-4">
              <h4 className="text-[13px] font-black uppercase tracking-widest mb-6">À propos</h4>
              <ul className="space-y-4">
                {["À propos d'oraimo", "O-Club", "Vendus dans 60+ pays"].map((link) => (
                  <li key={link} className="text-gray-500 text-[12px] font-bold uppercase tracking-wider hover:text-oraimo-green cursor-pointer transition-colors">{link}</li>
                ))}
                <li 
                  onClick={() => isAdmin ? navigate('/admin') : setShowAdminLogin(true)} 
                  className="text-gray-500 text-[12px] font-bold uppercase tracking-wider hover:text-oraimo-green cursor-pointer transition-colors"
                >
                  Administration
                </li>
              </ul>
            </div>
            <FooterColumn title="Termes" links={["Conditions d'utilisation", "Politique de confidentialité", "Politique de cookies"]} />
            <FooterColumn title="Obtenir de l'aide" links={["FAQ", "Contactez-nous", "Suivi de commande"]} />
          </div>
          
          <div className="pt-10 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <Facebook size={20} className="text-gray-400 hover:text-oraimo-green cursor-pointer" />
              <Instagram size={20} className="text-gray-400 hover:text-oraimo-green cursor-pointer" />
              <Youtube size={20} className="text-gray-400 hover:text-oraimo-green cursor-pointer" />
              <Twitter size={20} className="text-gray-400 hover:text-oraimo-green cursor-pointer" />
            </div>
            <div className="flex items-center gap-6 opacity-50 grayscale hover:grayscale-0 transition-all">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
              <img src="https://picsum.photos/seed/mtn/100/100" alt="MTN MoMo" className="h-6" />
              <img src="https://picsum.photos/seed/orange/100/100" alt="Orange Money" className="h-6" />
            </div>
          </div>
          
          <p className="text-center text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-12">
            © 2026 oraimo Cameroun. Tous droits réservés.
          </p>
        </div>
      </footer>

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="fixed bottom-24 right-6 w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center text-oraimo-black z-40 border border-gray-100"
          >
            <ChevronUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Bar (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 flex gap-3 z-40">
        <button 
          onClick={() => setIsCartOpen(true)}
          className="flex-1 bg-white border border-oraimo-black text-oraimo-black py-3 rounded-full font-bold text-sm uppercase relative"
        >
          Panier
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-oraimo-green text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {cartItems.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => navigate('/collections/all')}
          className="flex-1 bg-oraimo-green text-white py-3 rounded-full font-bold text-sm uppercase"
        >
          Boutique
        </button>
      </div>

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[100] bg-oraimo-black text-white p-4 rounded-full shadow-2xl hover:bg-oraimo-green transition-all"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setShowAdminLogin(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-black"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-oraimo-green/10 rounded-2xl flex items-center justify-center text-oraimo-green mb-4">
                  <Lock size={32} />
                </div>
                <h2 className="text-2xl font-black italic uppercase tracking-tight">Accès Administrateur</h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2 text-center">Identifiez-vous pour gérer la boutique</p>
              </div>

              <form onSubmit={handleManualAdminLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 mb-1 block">Nom d'utilisateur</label>
                  <input 
                    type="text" 
                    value={adminLoginForm.username}
                    onChange={(e) => setAdminLoginForm({ ...adminLoginForm, username: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-oraimo-green outline-none"
                    placeholder="admin"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 mb-1 block">Mot de passe</label>
                  <input 
                    type="password" 
                    value={adminLoginForm.password}
                    onChange={(e) => setAdminLoginForm({ ...adminLoginForm, password: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-oraimo-green outline-none"
                    placeholder="••••••••"
                  />
                </div>
                {adminLoginError && <p className="text-red-500 text-[10px] font-bold uppercase text-center">{adminLoginError}</p>}
                <button 
                  type="submit"
                  className="w-full bg-oraimo-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-oraimo-green transition-all shadow-lg shadow-black/10"
                >
                  Se connecter
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-3 ${
              notification.type === 'success' ? 'bg-oraimo-green text-white' : 'bg-red-600 text-white'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <CheckoutModal 
            cartItems={cartItems} 
            total={cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)}
            onClose={() => setIsCheckoutOpen(false)}
            onSuccess={() => {
              setCartItems([]);
              setIsCheckoutOpen(false);
              showNotification('Commande passée avec succès !');
            }}
            showNotification={showNotification}
            formatPrice={formatPrice}
            settings={settings}
          />
        )}
      </AnimatePresence>
      <a 
        href={`https://wa.me/${settings.whatsapp}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-24 left-6 w-12 h-12 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-xl z-40 hover:scale-110 transition-transform"
      >
        <MessageCircle size={24} />
      </a>
    </div>
  );
};

const ProductDetailPage = ({ products, onAddToCart, settings, showNotification, handleShare, formatPrice }: { products: Product[], onAddToCart: (p: Product, q?: number) => void, settings: SiteSettings, showNotification: (m: string, t?: 'success' | 'error') => void, handleShare: (p: Product) => void, formatPrice: (p: number) => string }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const product = products.find(p => p.id === id);
  const initialIsOrdering = (location.state as any)?.openOrderForm || false;

  useSEO(
    product?.name || 'Produit', 
    product?.seoDescription || product?.description || '', 
    product?.image,
    product,
    settings.seoKeywords
  );

  if (!product) return <div className="container py-20 text-center">Produit non trouvé</div>;

  return (
    <ProductDetail 
      product={product} 
      products={products}
      onBack={() => navigate('/')} 
      onAddToCart={onAddToCart} 
      onSelectProduct={(p) => navigate(`/product/${p.id}`)}
      settings={settings}
      showNotification={showNotification}
      initialIsOrdering={initialIsOrdering}
      handleShare={handleShare}
      formatPrice={formatPrice}
    />
  );
};

const CategoryPage = ({ products, addToCart, settings, formatPrice }: { products: Product[], addToCart: (p: Product) => void, settings: SiteSettings, formatPrice: (p: number) => string }) => {
  const { category } = useParams();
  const navigate = useNavigate();
  
  // Map URL category to display name
  const categoryMap: { [key: string]: string } = {
    'audio': 'Audio',
    'power': 'Power',
    'wearable': 'Montre et bureau',
    'home-appliances': 'Appareils électroménagers',
    'personal-care': 'Soins personnels'
  };

  const displayName = categoryMap[category || ''] || category;
  const filteredProducts = products.filter(p => p.category.toLowerCase() === displayName?.toLowerCase() || category === 'all');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [category]);

  return (
    <div className="py-12 bg-white min-h-screen">
      <div className="container">
        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-8">
          <Link to="/" className="hover:text-oraimo-green">Accueil</Link>
          <ChevronRight size={12} />
          <span className="text-oraimo-black">{displayName}</span>
        </div>

        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight mb-2 italic">
              {displayName}
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
              {filteredProducts.length} Produits trouvés
            </p>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                settings={settings}
                formatPrice={formatPrice}
                onClick={() => navigate(`/product/${product.id}`)} 
                onAddToCart={(e) => { e.stopPropagation(); addToCart(product); }} 
                onBuyNow={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`, { state: { openOrderForm: true } }); }}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-gray-50 rounded-3xl">
            <p className="text-gray-400 font-bold">Aucun produit trouvé dans cette catégorie.</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-6 bg-oraimo-green text-white px-8 py-3 rounded-full font-bold uppercase tracking-wider"
            >
              Retour à l'accueil
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = ({ products, settings, showNotification, isAdmin, user, formatPrice, categories }: { products: Product[], settings: SiteSettings, showNotification: (m: string, t?: 'success' | 'error') => void, isAdmin: boolean, user: any, formatPrice: (p: number) => string, categories: any[] }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'stats'), orderBy('date', 'desc'), limit(30));
    return onSnapshot(q, (snapshot) => {
      setStats(snapshot.docs.map(doc => doc.data()).reverse());
    });
  }, []);

  const dashboardData = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    
    // Group orders by date for chart
    const ordersByDate = orders.reduce((acc: any, order) => {
      const date = new Date(order.createdAt).toLocaleDateString();
      acc[date] = (acc[date] || 0) + order.totalAmount;
      return acc;
    }, {});

    const chartData = Object.keys(ordersByDate).map(date => ({
      date,
      revenue: ordersByDate[date]
    })).slice(-7);

    return {
      totalRevenue,
      deliveredOrders,
      pendingOrders,
      chartData
    };
  }, [orders]);

  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editSettings, setEditSettings] = useState(settings);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  
  // Login state
  const [isLoggedIn, setIsLoggedIn] = useState(isAdmin);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Sync with Firebase Auth isAdmin state
  useEffect(() => {
    setIsLoggedIn(isAdmin);
  }, [isAdmin]);

  const isSuperAdmin = user?.email === 'joellmikamm@gmail.com' || isAdmin;

  useSEO('Administration', 'Gérez votre boutique oraimo');

  useEffect(() => {
    if (isLoggedIn) {
      const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snapshot) => {
        const orderData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(orderData);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      });
      return unsubOrders;
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && isSuperAdmin) {
      const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snapshot) => {
        const userData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        setUsersList(userData);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      });
      return unsubUsers;
    }
  }, [isLoggedIn, isSuperAdmin]);

  const handleSaveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), editSettings);
      setIsEditingSettings(false);
      showNotification('Paramètres enregistrés avec succès');
    } catch (err) {
      console.error(err);
      showNotification('Erreur lors de l\'enregistrement des paramètres', 'error');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if ((loginForm.username === 'admin' && loginForm.password === 'oraimo2026') || 
        (loginForm.username === 'joellmikamm@gmail.com' && loginForm.password === 'oraimo2026@')) {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Identifiants incorrects');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      showNotification('Déconnexion réussie');
      navigate('/');
    } catch (error) {
      console.error(error);
      showNotification('Erreur de déconnexion', 'error');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-white min-h-[calc(100vh-80px)] flex flex-col">
        {/* Main Content */}
        <div className="flex-grow flex flex-col items-center justify-center p-4 py-8">
          <div className="w-full max-w-md bg-white rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-10 flex flex-col items-center border border-gray-50">
            {/* Lock Icon */}
            <div className="w-20 h-20 bg-[#F5F9E8] rounded-2xl flex items-center justify-center text-oraimo-green mb-8">
              <Lock size={40} strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-center mb-2">
              Accès Administrateur
            </h2>
            <p className="text-gray-400 text-[13px] font-bold uppercase tracking-[0.2em] mb-12">
              Veuillez vous identifier
            </p>

            {/* Form */}
            <form onSubmit={handleAdminLogin} className="w-full space-y-8">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-4">
                <p className="text-[10px] text-blue-600 font-bold leading-relaxed">
                  <span className="block mb-1">💡 ACCÈS ADMINISTRATEUR :</span>
                  Vous pouvez vous connecter avec vos identifiants ou via Google. L'enregistrement des données est désormais possible avec les deux méthodes.
                </p>
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-6 mb-3 block">
                  Nom d'utilisateur
                </label>
                <input 
                  type="text" 
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full bg-white border-2 border-oraimo-green rounded-[25px] px-8 py-5 text-base font-bold outline-none transition-all focus:shadow-lg focus:shadow-oraimo-green/10"
                  placeholder="admin"
                />
              </div>
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-6 mb-3 block">
                  Mot de passe
                </label>
                <input 
                  type="password" 
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full bg-[#F8F8F8] border-none rounded-[25px] px-8 py-5 text-base font-bold outline-none transition-all focus:bg-gray-100"
                  placeholder="••••••••"
                />
              </div>
              
              {loginError && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{loginError}</p>
              )}

              <div className="space-y-4">
                <button 
                  type="submit"
                  className="w-full bg-oraimo-black text-white py-6 rounded-[25px] font-black uppercase tracking-[0.2em] text-sm hover:bg-oraimo-green transition-all shadow-2xl shadow-black/20 active:scale-95"
                >
                  SE CONNECTER
                </button>

                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <span className="relative px-4 bg-white text-[10px] font-black text-gray-300 uppercase tracking-widest">OU</span>
                </div>

                <button 
                  type="button"
                  onClick={async () => {
                    const provider = new GoogleAuthProvider();
                    try {
                      await signInWithPopup(auth, provider);
                      setIsLoggedIn(true);
                      showNotification('Connexion Google réussie');
                    } catch (error) {
                      console.error(error);
                      showNotification('Erreur de connexion Google', 'error');
                    }
                  }}
                  className="w-full bg-white border-2 border-gray-100 text-oraimo-black py-6 rounded-[25px] font-black uppercase tracking-[0.2em] text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
                  CONTINUER AVEC GOOGLE
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Floating WhatsApp */}
        <div className="fixed bottom-32 left-6 z-50">
          <a 
            href={`https://wa.me/${settings.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-2xl shadow-[#25D366]/40 hover:scale-110 transition-transform active:scale-90"
          >
            <MessageCircle size={32} fill="white" />
          </a>
        </div>

        {/* Bottom Navigation */}
        <div className="p-6 grid grid-cols-2 gap-4 bg-white border-t border-gray-100 sticky bottom-0">
          <button onClick={() => navigate('/cart')} className="w-full py-6 border-2 border-oraimo-black rounded-[30px] font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-colors">
            Panier
          </button>
          <button onClick={() => navigate('/collections/all')} className="w-full py-6 bg-oraimo-green text-white rounded-[30px] font-black uppercase tracking-widest text-xs shadow-xl shadow-oraimo-green/20 hover:bg-opacity-90 transition-all">
            Boutique
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200 sticky top-16 md:top-20 z-40">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black italic">Admin Panel</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-oraimo-black text-white' : 'hover:bg-gray-100'}`}
              >
                Tableau de Bord
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-oraimo-black text-white' : 'hover:bg-gray-100'}`}
              >
                Commandes
              </button>
              <button 
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-oraimo-black text-white' : 'hover:bg-gray-100'}`}
              >
                Produits
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-oraimo-black text-white' : 'hover:bg-gray-100'}`}
              >
                Paramètres
              </button>
              {isSuperAdmin && (
                <>
                  <button 
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-oraimo-black text-white' : 'hover:bg-gray-100'}`}
                  >
                    Utilisateurs
                  </button>
                  <button 
                    onClick={() => setActiveTab('system')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'system' ? 'bg-oraimo-black text-white' : 'hover:bg-gray-100'}`}
                  >
                    Système
                  </button>
                </>
              )}
            </div>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-600 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="container py-10">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-oraimo-green/10 rounded-2xl text-oraimo-green">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Chiffre d'Affaires</p>
                    <h4 className="text-2xl font-black">{formatPrice(dashboardData.totalRevenue)}</h4>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Commandes Totales</p>
                    <h4 className="text-2xl font-black">{orders.length}</h4>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">En Attente</p>
                    <h4 className="text-2xl font-black">{dashboardData.pendingOrders}</h4>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Trafic (Aujourd'hui)</p>
                    <h4 className="text-2xl font-black">{stats.find(s => s.date === new Date().toISOString().split('T')[0])?.visits || 0}</h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Traffic Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h4 className="text-sm font-black mb-4 uppercase tracking-widest flex items-center gap-2">
                  <Globe size={16} /> Origine du Trafic
                </h4>
                <div className="space-y-3">
                  {(() => {
                    const todayStats = stats.find(s => s.date === new Date().toISOString().split('T')[0]);
                    const sources = todayStats?.sources || {};
                    const entries = Object.entries(sources);
                    if (entries.length === 0) return <p className="text-[10px] text-gray-400 font-bold italic">Aucune donnée aujourd'hui</p>;
                    return entries.sort((a, b) => (b[1] as number) - (a[1] as number)).map(([source, count]) => (
                      <div key={source} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-600">{source.replace(/_/g, '.')}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded-lg font-black">{count as number}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h4 className="text-sm font-black mb-4 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={16} /> Lieux d'Origine
                </h4>
                <div className="space-y-3">
                  {(() => {
                    const todayStats = stats.find(s => s.date === new Date().toISOString().split('T')[0]);
                    const locations = todayStats?.locations || {};
                    const entries = Object.entries(locations);
                    if (entries.length === 0) return <p className="text-[10px] text-gray-400 font-bold italic">Aucune donnée aujourd'hui</p>;
                    return entries.sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5).map(([loc, count]) => (
                      <div key={loc} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-600">{loc.replace(/_/g, ' ')}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded-lg font-black">{count as number}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h4 className="text-sm font-black mb-4 uppercase tracking-widest flex items-center gap-2">
                  <User size={16} /> Démographie (Sexe/Âge)
                </h4>
                <div className="space-y-3">
                  {(() => {
                    const todayStats = stats.find(s => s.date === new Date().toISOString().split('T')[0]);
                    const demographics = todayStats?.demographics || {};
                    const entries = Object.entries(demographics);
                    if (entries.length === 0) return <p className="text-[10px] text-gray-400 font-bold italic">Aucune donnée aujourd'hui</p>;
                    return entries.sort((a, b) => (b[1] as number) - (a[1] as number)).map(([demo, count]) => (
                      <div key={demo} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-600">{demo.replace(/_/g, ' ')}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded-lg font-black">{count as number}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h4 className="text-lg font-black mb-6 flex items-center gap-2">
                  <BarChart2 size={20} /> Évolution des Ventes
                </h4>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData.chartData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00FF00" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#00FF00" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#00FF00" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h4 className="text-lg font-black mb-6 flex items-center gap-2">
                  <Activity size={20} /> Activité du Site (30 jours)
                </h4>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" hide />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                      />
                      <Line type="monotone" dataKey="visits" name="Visites" stroke="#000" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="cartAdds" name="Ajouts au Panier" stroke="#00FF00" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm col-span-2">
                <h4 className="text-lg font-black mb-6">Dernières Activités</h4>
                <div className="space-y-4">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-oraimo-black shadow-sm">
                          <ShoppingBag size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{order.customerName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black">{formatPrice(order.totalAmount)}</p>
                        <span className="text-[10px] font-black uppercase text-oraimo-green">Nouvelle Commande</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h4 className="text-lg font-black mb-6">Répartition Stock</h4>
                <div className="space-y-6">
                  {categories.map(cat => {
                    const count = products.filter(p => p.category === cat.id).length;
                    const percentage = (count / products.length) * 100;
                    return (
                      <div key={cat.id}>
                        <div className="flex justify-between text-xs font-bold mb-2">
                          <span>{cat.name}</span>
                          <span>{count} produits</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-oraimo-green transition-all" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black">Commandes en temps réel</h3>
              <span className="bg-oraimo-green/10 text-oraimo-green px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {orders.length} Commandes
              </span>
            </div>
            <div className="grid gap-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">#{order.id.slice(-6)}</span>
                        <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status}
                        </span>
                        <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 flex items-center gap-1`}>
                          {order.paymentMethod === 'cash_on_delivery' ? <Banknote size={10} /> : order.paymentMethod === 'mobile_money' ? <Smartphone size={10} /> : <CreditCard size={10} />}
                          {order.paymentMethod === 'cash_on_delivery' ? 'Cash' : order.paymentMethod === 'mobile_money' ? 'Momo' : 'Carte'}
                        </span>
                        <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                          order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {order.paymentStatus === 'paid' ? 'Payé' : order.paymentStatus === 'failed' ? 'Échec' : 'Non payé'}
                        </span>
                      </div>
                      <h4 className="text-lg font-black">{order.customerName}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Phone size={14} /> {order.customerPhone}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} /> {order.city}, {order.deliveryAddress}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black">{formatPrice(order.totalAmount)}</p>
                      <p className="text-xs text-gray-400 font-bold uppercase mt-1">
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Date inconnue'}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-gray-50 pt-4 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-2">
                      {order.items.map((item, i) => (
                        <span key={i} className="bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                          {item.quantity}x {item.name}
                          {item.color && (
                            <span className="text-[10px] text-gray-400">({item.color})</span>
                          )}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <select 
                        value={order.status}
                        onChange={async (e) => {
                          try {
                            await updateDoc(doc(db, 'orders', order.id), { status: e.target.value });
                          } catch (error) {
                            handleFirestoreError(error, OperationType.WRITE, `orders/${order.id}`);
                          }
                        }}
                        className="bg-gray-100 border-none rounded-lg px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-oraimo-green"
                      >
                        <option value="pending">En attente</option>
                        <option value="processing">Traitement</option>
                        <option value="shipped">Expédié</option>
                        <option value="delivered">Livré</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                      <select 
                        value={order.paymentStatus}
                        onChange={async (e) => {
                          try {
                            await updateDoc(doc(db, 'orders', order.id), { paymentStatus: e.target.value });
                          } catch (error) {
                            handleFirestoreError(error, OperationType.WRITE, `orders/${order.id}`);
                          }
                        }}
                        className="bg-gray-100 border-none rounded-lg px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-oraimo-green"
                      >
                        <option value="pending">Paiement en attente</option>
                        <option value="paid">Payé</option>
                        <option value="failed">Échec</option>
                      </select>
                      <button 
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            const invoiceHtml = `
                              <html>
                                <head>
                                  <title>Facture #${order.id.slice(-6)}</title>
                                  <style>
                                    body { font-family: sans-serif; padding: 40px; color: #333; }
                                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #93C01F; padding-bottom: 20px; margin-bottom: 30px; }
                                    .logo { font-size: 24px; font-weight: 900; font-style: italic; }
                                    .logo span { color: #93C01F; }
                                    .invoice-info { text-align: right; }
                                    .section { margin-bottom: 30px; }
                                    .section-title { font-size: 12px; font-weight: 900; text-transform: uppercase; color: #999; margin-bottom: 10px; }
                                    table { width: 100%; border-collapse: collapse; }
                                    th { text-align: left; border-bottom: 1px solid #eee; padding: 10px; font-size: 12px; text-transform: uppercase; }
                                    td { padding: 10px; border-bottom: 1px solid #eee; }
                                    .total { text-align: right; font-size: 20px; font-weight: 900; margin-top: 20px; }
                                    .footer { margin-top: 50px; font-size: 10px; color: #999; text-align: center; }
                                    @media print { .no-print { display: none; } }
                                  </style>
                                </head>
                                <body>
                                  <div class="header">
                                    <div class="logo">oraimo<span>.</span></div>
                                    <div class="invoice-info">
                                      <div style="font-weight: 900; font-size: 18px;">FACTURE</div>
                                      <div>#${order.id.slice(-6)}</div>
                                      <div>${order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : ''}</div>
                                    </div>
                                  </div>
                                  
                                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                                    <div class="section">
                                      <div class="section-title">Client</div>
                                      <div style="font-weight: bold;">${order.customerName}</div>
                                      <div>${order.customerPhone}</div>
                                      <div>${order.customerEmail || ''}</div>
                                    </div>
                                    <div class="section">
                                      <div class="section-title">Livraison & Paiement</div>
                                      <div>${order.city}</div>
                                      <div>${order.deliveryAddress}</div>
                                      <div style="margin-top: 8px; font-weight: bold; color: #000;">
                                        Mode de paiement: ${
                                          order.paymentMethod === 'cash_on_delivery' ? 'Paiement à la livraison' :
                                          order.paymentMethod === 'mobile_money' ? 'Mobile Money' :
                                          order.paymentMethod === 'paypal' ? 'PayPal' :
                                          order.paymentMethod === 'card' ? 'Carte Bancaire' : order.paymentMethod
                                        }
                                      </div>
                                    </div>
                                  </div>

                                  <div class="section">
                                    <div class="section-title">Articles</div>
                                    <table>
                                      <thead>
                                        <tr>
                                          <th>Produit</th>
                                          <th>Prix</th>
                                          <th>Qté</th>
                                          <th style="text-align: right;">Total</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        ${order.items.map(item => `
                                          <tr>
                                            <td>${item.name}</td>
                                            <td>${formatPrice(item.price)}</td>
                                            <td>${item.quantity}</td>
                                            <td style="text-align: right;">${formatPrice(item.price * item.quantity)}</td>
                                          </tr>
                                        `).join('')}
                                      </tbody>
                                    </table>
                                  </div>

                                  <div class="total">
                                    TOTAL: ${formatPrice(order.totalAmount)}
                                  </div>

                                  <div class="footer">
                                    Merci pour votre confiance ! oraimo Cameroun - Boutique Officielle.
                                  </div>
                                  
                                  <script>
                                    window.onload = () => { window.print(); };
                                  </script>
                                </body>
                              </html>
                            `;
                            printWindow.document.write(invoiceHtml);
                            printWindow.document.close();
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-oraimo-green transition-colors"
                        title="Imprimer la facture"
                      >
                        <Printer size={18} />
                      </button>
                      <button 
                        onClick={async () => {
                          if (window.confirm('Supprimer cette commande ?')) {
                            try {
                              await deleteDoc(doc(db, 'orders', order.id));
                            } catch (error) {
                              handleFirestoreError(error, OperationType.DELETE, `orders/${order.id}`);
                            }
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black">Configuration du Site</h3>
              {!isEditingSettings && (
                <button 
                  onClick={() => setIsEditingSettings(true)}
                  className="bg-oraimo-black text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                >
                  <Edit3 size={16} /> Modifier
                </button>
              )}
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Nom du Site</label>
                  <input 
                    disabled={!isEditingSettings}
                    type="text" 
                    value={editSettings.siteName}
                    onChange={(e) => setEditSettings({...editSettings, siteName: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Email de Contact</label>
                  <input 
                    disabled={!isEditingSettings}
                    type="email" 
                    value={editSettings.email}
                    onChange={(e) => setEditSettings({...editSettings, email: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Couleur Primaire</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border border-gray-200" style={{ backgroundColor: editSettings.primaryColor }} />
                    <input 
                      disabled={!isEditingSettings}
                      type="text" 
                      value={editSettings.primaryColor}
                      onChange={(e) => setEditSettings({...editSettings, primaryColor: e.target.value})}
                      className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Couleur Secondaire</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border border-gray-200" style={{ backgroundColor: editSettings.secondaryColor }} />
                    <input 
                      disabled={!isEditingSettings}
                      type="text" 
                      value={editSettings.secondaryColor}
                      onChange={(e) => setEditSettings({...editSettings, secondaryColor: e.target.value})}
                      className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Téléphone</label>
                  <input 
                    disabled={!isEditingSettings}
                    type="text" 
                    value={editSettings.phone}
                    onChange={(e) => setEditSettings({...editSettings, phone: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">WhatsApp (Format: 237...)</label>
                  <input 
                    disabled={!isEditingSettings}
                    type="text" 
                    value={editSettings.whatsapp}
                    onChange={(e) => setEditSettings({...editSettings, whatsapp: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Numéro MTN (Paiement)</label>
                  <input 
                    disabled={!isEditingSettings}
                    type="text" 
                    value={editSettings.mtnNumber || ''}
                    onChange={(e) => setEditSettings({...editSettings, mtnNumber: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Numéro Orange (Paiement)</label>
                  <input 
                    disabled={!isEditingSettings}
                    type="text" 
                    value={editSettings.orangeNumber || ''}
                    onChange={(e) => setEditSettings({...editSettings, orangeNumber: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Email PayPal (Paiement)</label>
                  <input 
                    disabled={!isEditingSettings}
                    type="text" 
                    value={editSettings.paypalEmail || ''}
                    onChange={(e) => setEditSettings({...editSettings, paypalEmail: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50">
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                  <CreditCard size={16} /> Configuration des Paiements (Cameroun)
                </h4>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Agrégateur de Paiement</label>
                    <select 
                      disabled={!isEditingSettings}
                      value={editSettings.paymentAggregator || 'none'}
                      onChange={(e) => setEditSettings({...editSettings, paymentAggregator: e.target.value as any})}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                    >
                      <option value="none">Aucun (Paiement à la livraison uniquement)</option>
                      <option value="campay">Campay (Mobile Money)</option>
                      <option value="cinetpay">CinetPay (Mobile Money & Cartes)</option>
                      <option value="flutterwave">Flutterwave (International & Mobile Money)</option>
                    </select>
                  </div>

                  {editSettings.paymentAggregator === 'campay' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">Campay App ID</label>
                        <input 
                          disabled={!isEditingSettings}
                          type="password" 
                          value={editSettings.campayAppId || ''}
                          onChange={(e) => setEditSettings({...editSettings, campayAppId: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">Campay App Secret</label>
                        <input 
                          disabled={!isEditingSettings}
                          type="password" 
                          value={editSettings.campayAppSecret || ''}
                          onChange={(e) => setEditSettings({...editSettings, campayAppSecret: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                        />
                      </div>
                    </div>
                  )}

                  {editSettings.paymentAggregator === 'cinetpay' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">CinetPay API Key</label>
                        <input 
                          disabled={!isEditingSettings}
                          type="password" 
                          value={editSettings.cinetpayApiKey || ''}
                          onChange={(e) => setEditSettings({...editSettings, cinetpayApiKey: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2">CinetPay Site ID</label>
                        <input 
                          disabled={!isEditingSettings}
                          type="text" 
                          value={editSettings.cinetpaySiteId || ''}
                          onChange={(e) => setEditSettings({...editSettings, cinetpaySiteId: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50">
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                  <Globe size={16} /> SEO & Référencement (Cameroun)
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Titre SEO</label>
                    <input 
                      disabled={!isEditingSettings}
                      type="text" 
                      value={editSettings.seoTitle}
                      onChange={(e) => setEditSettings({...editSettings, seoTitle: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Description SEO</label>
                    <textarea 
                      disabled={!isEditingSettings}
                      rows={3}
                      value={editSettings.seoDescription}
                      onChange={(e) => setEditSettings({...editSettings, seoDescription: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50 resize-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-2">Mots-clés SEO (Séparés par des virgules)</label>
                    <input 
                      disabled={!isEditingSettings}
                      type="text" 
                      value={editSettings.seoKeywords || ''}
                      onChange={(e) => setEditSettings({...editSettings, seoKeywords: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                      placeholder="oraimo, écouteurs, montres, accessoires..."
                    />
                  </div>
                </div>
              </div>

              {/* Advanced UI Customization */}
              <div className="pt-6 border-t border-gray-50">
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                  <Type size={16} /> Personnalisation Granulaire (UI/UX)
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Police de caractères (Google Fonts)</label>
                    <input 
                      disabled={!isEditingSettings}
                      type="text" 
                      value={editSettings.fontFamily || 'Inter'}
                      onChange={(e) => setEditSettings({...editSettings, fontFamily: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                      placeholder="Inter, Montserrat, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Espacement des lettres (Tracking)</label>
                    <input 
                      disabled={!isEditingSettings}
                      type="text" 
                      value={editSettings.letterSpacing || 'normal'}
                      onChange={(e) => setEditSettings({...editSettings, letterSpacing: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                      placeholder="normal, -0.02em, 0.05em"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Graisse du texte (Font Weight)</label>
                    <select 
                      disabled={!isEditingSettings}
                      value={editSettings.fontWeightText || '400'}
                      onChange={(e) => setEditSettings({...editSettings, fontWeightText: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                    >
                      <option value="300">Léger (300)</option>
                      <option value="400">Normal (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semi-Bold (600)</option>
                      <option value="700">Bold (700)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Graisse des chiffres (Prix)</label>
                    <select 
                      disabled={!isEditingSettings}
                      value={editSettings.fontWeightNumbers || '700'}
                      onChange={(e) => setEditSettings({...editSettings, fontWeightNumbers: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                    >
                      <option value="400">Normal (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semi-Bold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">Extra-Bold (800)</option>
                      <option value="900">Black (900)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Number Formatting */}
              <div className="pt-6 border-t border-gray-50">
                <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                  <Hash size={16} /> Formatage des Nombres & Prix
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Séparateur de milliers</label>
                    <input 
                      disabled={!isEditingSettings}
                      type="text" 
                      value={editSettings.thousandsSeparator || ' '}
                      onChange={(e) => setEditSettings({...editSettings, thousandsSeparator: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                      placeholder="Espace, virgule, point"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Nombre de décimales</label>
                    <input 
                      disabled={!isEditingSettings}
                      type="number" 
                      value={editSettings.decimalPlaces || 0}
                      onChange={(e) => setEditSettings({...editSettings, decimalPlaces: parseInt(e.target.value)})}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Symbole monétaire</label>
                    <input 
                      disabled={!isEditingSettings}
                      type="text" 
                      value={editSettings.currencySymbol || 'FCFA'}
                      onChange={(e) => setEditSettings({...editSettings, currencySymbol: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Position du symbole</label>
                    <select 
                      disabled={!isEditingSettings}
                      value={editSettings.currencyPosition || 'suffix'}
                      onChange={(e) => setEditSettings({...editSettings, currencyPosition: e.target.value as 'prefix' | 'suffix'})}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50"
                    >
                      <option value="prefix">Avant le montant (ex: $100)</option>
                      <option value="suffix">Après le montant (ex: 100 FCFA)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Hero Banners Management */}
              <div className="pt-6 border-t border-gray-50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-1">
                      <LayoutDashboard size={16} /> Bannières d'accueil (Carousel)
                    </h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Gérez les images défilantes de la page d'accueil</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        className="hidden"
                        id="bulk-banner-upload"
                        disabled={!isEditingSettings}
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            const newBanners = [...(editSettings.heroBanners || [])];
                            let loadedCount = 0;
                            Array.from(files).forEach((file: File) => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                newBanners.push({ 
                                  image: reader.result as string, 
                                  title: 'Nouvelle Offre', 
                                  subtitle: 'Description de l\'offre', 
                                  cta: 'Découvrir',
                                  link: '/collections/all'
                                });
                                loadedCount++;
                                if (loadedCount === files.length) {
                                  setEditSettings({...editSettings, heroBanners: newBanners});
                                  showNotification(`${files.length} bannières ajoutées`);
                                }
                              };
                              reader.readAsDataURL(file);
                            });
                          }
                        }}
                      />
                      <label 
                        htmlFor="bulk-banner-upload"
                        className={`bg-oraimo-green text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 ${!isEditingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Images size={14} /> Importation Groupée
                      </label>
                    </div>
                    <button 
                      disabled={!isEditingSettings}
                      onClick={() => {
                        const newBanners = [...(editSettings.heroBanners || [])];
                        newBanners.push({ image: '', title: '', subtitle: '', cta: 'Découvrir', link: '' });
                        setEditSettings({...editSettings, heroBanners: newBanners});
                      }}
                      className="bg-oraimo-black text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                    >
                      <Plus size={14} /> Ajouter manuellement
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                  {(editSettings.heroBanners || []).map((banner, idx) => (
                    <div key={idx} className="p-8 bg-gray-50 rounded-[32px] relative border border-gray-100 shadow-sm group">
                      <div className="absolute -top-3 -left-3 w-8 h-8 bg-oraimo-black text-white rounded-full flex items-center justify-center text-xs font-black italic shadow-lg z-10">
                        {idx + 1}
                      </div>
                      <button 
                        disabled={!isEditingSettings}
                        onClick={() => {
                          const newBanners = [...(editSettings.heroBanners || [])];
                          newBanners.splice(idx, 1);
                          setEditSettings({...editSettings, heroBanners: newBanners});
                        }}
                        className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 disabled:opacity-50 transition-colors bg-white rounded-full shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <ImageUploadField 
                            disabled={!isEditingSettings}
                            label={`Visuel de la bannière`}
                            value={banner.image}
                            onChange={(val) => {
                              const newBanners = [...(editSettings.heroBanners || [])];
                              newBanners[idx] = { ...newBanners[idx], image: val };
                              setEditSettings({...editSettings, heroBanners: newBanners});
                            }}
                          />
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                              <LinkIcon size={12} /> Lien de redirection
                            </label>
                            <input 
                              disabled={!isEditingSettings}
                              type="text" 
                              value={banner.link || ''}
                              onChange={(e) => {
                                const newBanners = [...(editSettings.heroBanners || [])];
                                newBanners[idx] = { ...newBanners[idx], link: e.target.value };
                                setEditSettings({...editSettings, heroBanners: newBanners});
                              }}
                              placeholder="/collections/audio ou https://..."
                              className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50 shadow-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-4 bg-white/50 p-6 rounded-2xl border border-white">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Contenu Textuel</h5>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Titre Principal</label>
                            <input 
                              disabled={!isEditingSettings}
                              type="text" 
                              value={banner.title}
                              onChange={(e) => {
                                const newBanners = [...(editSettings.heroBanners || [])];
                                newBanners[idx] = { ...newBanners[idx], title: e.target.value };
                                setEditSettings({...editSettings, heroBanners: newBanners});
                              }}
                              className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50 shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Sous-titre / Description</label>
                            <textarea 
                              disabled={!isEditingSettings}
                              rows={2}
                              value={banner.subtitle}
                              onChange={(e) => {
                                const newBanners = [...(editSettings.heroBanners || [])];
                                newBanners[idx] = { ...newBanners[idx], subtitle: e.target.value };
                                setEditSettings({...editSettings, heroBanners: newBanners});
                              }}
                              className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50 shadow-sm resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Texte du bouton (CTA)</label>
                            <input 
                              disabled={!isEditingSettings}
                              type="text" 
                              value={banner.cta}
                              onChange={(e) => {
                                const newBanners = [...(editSettings.heroBanners || [])];
                                newBanners[idx] = { ...newBanners[idx], cta: e.target.value };
                                setEditSettings({...editSettings, heroBanners: newBanners});
                              }}
                              className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green disabled:opacity-50 shadow-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(editSettings.heroBanners || []).length === 0 && (
                    <div className="py-20 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                      <LayoutDashboard size={48} className="mx-auto text-gray-200 mb-4" />
                      <p className="text-gray-400 font-bold">Aucune bannière configurée.</p>
                      <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-1">Ajoutez des bannières pour animer votre page d'accueil</p>
                    </div>
                  )}
                </div>
              </div>

              {isEditingSettings && (
                  <div className="flex gap-3 pt-6">
                    <EnregistrerButton 
                      onClick={handleSaveSettings}
                      label="Enregistrer"
                    />
                    <button 
                      onClick={() => { setIsEditingSettings(false); setEditSettings(settings); }}
                      className="px-8 py-4 rounded-xl font-black uppercase tracking-widest text-gray-400 hover:bg-gray-100"
                    >
                      Annuler
                    </button>
                  </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black">Gestion des Produits</h3>
              <button 
                onClick={() => {
                  setEditingProduct({
                    name: '',
                    price: 0,
                    originalPrice: 0,
                    image: '',
                    category: 'Audio',
                    tag: '',
                    description: '',
                    seoDescription: '',
                    rating: 5,
                    reviewCount: 0,
                    features: [],
                    images: []
                  } as any);
                  setIsAddingProduct(true);
                }}
                className="bg-oraimo-green text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                <PlusCircle size={16} /> Ajouter un produit
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4">
                  <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={product.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-black text-sm line-clamp-1">{product.name}</h4>
                    <p className="text-oraimo-green font-black text-sm mt-1">{formatPrice(product.price)}</p>
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setIsAddingProduct(true);
                        }}
                        className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-oraimo-green transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                        <button 
                          onClick={() => setProductToDelete(product.id)}
                          className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      <button onClick={() => window.open(`/product/${product.id}`, '_blank')} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isSuperAdmin && activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black">Gestion des Utilisateurs</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-oraimo-green/10 text-oraimo-green text-[10px] font-black uppercase tracking-widest rounded-full">
                  {usersList.length} Utilisateurs
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-bottom border-gray-100">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Utilisateur</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Rôle</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Statut</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {usersList.map((u) => (
                      <tr key={u.uid} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold">
                              {u.name?.charAt(0) || u.email?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{u.name || 'Sans nom'}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={u.role}
                            onChange={async (e) => {
                              try {
                                await updateDoc(doc(db, 'users', u.uid), { role: e.target.value });
                                showNotification('Rôle mis à jour');
                              } catch (err) {
                                handleFirestoreError(err, OperationType.UPDATE, `users/${u.uid}`);
                              }
                            }}
                            className="bg-gray-50 border-none rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-oraimo-green"
                          >
                            <option value="user">Utilisateur</option>
                            <option value="admin">Administrateur</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            u.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {u.status === 'active' ? 'Actif' : 'Suspendu'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                const newStatus = u.status === 'active' ? 'suspended' : 'active';
                                try {
                                  await updateDoc(doc(db, 'users', u.uid), { status: newStatus });
                                  showNotification(`Utilisateur ${newStatus === 'active' ? 'activé' : 'suspendu'}`);
                                } catch (err) {
                                  handleFirestoreError(err, OperationType.UPDATE, `users/${u.uid}`);
                                }
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                u.status === 'active' ? 'text-gray-400 hover:text-red-600 bg-gray-50' : 'text-gray-400 hover:text-green-600 bg-gray-50'
                              }`}
                              title={u.status === 'active' ? 'Suspendre' : 'Activer'}
                            >
                              {u.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>
                            <button 
                              onClick={async () => {
                                if (window.confirm('Supprimer définitivement cet utilisateur ?')) {
                                  try {
                                    await deleteDoc(doc(db, 'users', u.uid));
                                    showNotification('Utilisateur supprimé');
                                  } catch (err) {
                                    handleFirestoreError(err, OperationType.DELETE, `users/${u.uid}`);
                                  }
                                }
                              }}
                              className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm font-bold italic">
                          Aucun utilisateur trouvé dans la base de données.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {isSuperAdmin && activeTab === 'system' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black italic uppercase tracking-tight">Configuration Système</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mode Maintenance</span>
                  <button 
                    onClick={() => setEditSettings({...editSettings, isMaintenanceMode: !editSettings.isMaintenanceMode})}
                    className={`w-12 h-6 rounded-full relative transition-colors ${editSettings.isMaintenanceMode ? 'bg-red-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editSettings.isMaintenanceMode ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                    <Key size={14} /> Clé API (Services Externes)
                  </label>
                  <input 
                    type="password" 
                    value={editSettings.apiKey || ''}
                    onChange={(e) => setEditSettings({...editSettings, apiKey: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green"
                    placeholder="sk-..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                    <Mail size={14} /> Serveur SMTP (Emails)
                  </label>
                  <input 
                    type="text" 
                    value={editSettings.smtpServer || ''}
                    onChange={(e) => setEditSettings({...editSettings, smtpServer: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-oraimo-green"
                    placeholder="smtp.example.com"
                  />
                </div>

                <div className="pt-6 border-t border-gray-50">
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <ShieldCheck size={16} /> Logs d'Audit & Sécurité
                  </h4>
                  <div className="bg-gray-50 rounded-2xl p-4 h-48 overflow-y-auto font-mono text-[10px] text-gray-500 space-y-1">
                    <p>[{new Date().toISOString()}] Super Admin login: {user?.email}</p>
                    <p>[{new Date().toISOString()}] System settings viewed</p>
                    <p className="text-oraimo-green">[{new Date().toISOString()}] All systems operational</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <EnregistrerButton 
                    onClick={handleSaveSettings}
                    label="Appliquer les changements"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {productToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center"
            >
              <Trash2 size={48} className="mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-black mb-2">Supprimer le produit ?</h3>
              <p className="text-gray-500 mb-8">Cette action est irréversible.</p>
              <div className="flex gap-4">
                <button 
                  onClick={async () => {
                    try {
                      try {
                        await deleteDoc(doc(db, 'products', productToDelete));
                      } catch (error) {
                        handleFirestoreError(error, OperationType.DELETE, `products/${productToDelete}`);
                      }
                      setProductToDelete(null);
                      showNotification('Produit supprimé');
                    } catch (err) {
                      showNotification('Erreur lors de la suppression', 'error');
                    }
                  }}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold"
                >
                  Supprimer
                </button>
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Product Edit/Add Modal */}
        {isAddingProduct && editingProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black">{editingProduct.id ? 'Modifier le produit' : 'Ajouter un produit'}</h3>
                <button onClick={() => setIsAddingProduct(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Nom du produit</label>
                    <input 
                      type="text" 
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Catégorie</label>
                    <select 
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold"
                    >
                      {CATEGORIES.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Prix (FCFA)</label>
                    <input 
                      type="number" 
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                      className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Prix Original (Optionnel)</label>
                    <input 
                      type="number" 
                      value={editingProduct.originalPrice || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, originalPrice: Number(e.target.value)})}
                      className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold"
                    />
                  </div>
                </div>

                <ImageUploadField 
                  label="Image principale" 
                  value={editingProduct.image} 
                  onChange={(val) => setEditingProduct({...editingProduct, image: val})} 
                />

                <BulkImageUpload 
                  label="Galerie d'images"
                  values={editingProduct.images || []}
                  onChange={(vals) => setEditingProduct({...editingProduct, images: vals})}
                />

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400">Description (Supporte le Markdown)</label>
                    <button 
                      type="button"
                      onClick={() => {
                        let text = editingProduct.description || '';
                        if (!text.includes('#') && !text.includes('*')) {
                          const lines = text.split('\n').filter(l => l.trim() !== '');
                          if (lines.length > 0) {
                            let formatted = `# ${lines[0]}\n\n`;
                            if (lines.length > 1) {
                              formatted += lines.slice(1).map(l => `* ${l}`).join('\n');
                            }
                            setEditingProduct({...editingProduct, description: formatted});
                          }
                        }
                      }}
                      className="text-[10px] font-black uppercase tracking-widest text-oraimo-green hover:underline"
                    >
                      Organiser automatiquement
                    </button>
                  </div>
                  <textarea 
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    placeholder="Utilisez # pour les titres, * pour les listes..."
                    className="w-full bg-gray-50 border-none rounded-xl p-4 font-medium h-48 focus:ring-2 focus:ring-oraimo-green outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Description SEO (Optionnel - Pour Google)</label>
                  <textarea 
                    value={editingProduct.seoDescription || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, seoDescription: e.target.value})}
                    placeholder="Une courte description accrocheuse pour les moteurs de recherche..."
                    className="w-full bg-gray-50 border-none rounded-xl p-4 font-medium h-24 focus:ring-2 focus:ring-oraimo-green outline-none transition-all"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 italic">Si vide, la description principale sera utilisée.</p>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Tag (ex: HOT, NOUVEAU)</label>
                  <input 
                    type="text" 
                    value={editingProduct.tag}
                    onChange={(e) => setEditingProduct({...editingProduct, tag: e.target.value})}
                    className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Couleurs disponibles (séparées par des virgules)</label>
                  <input 
                    type="text" 
                    value={editingProduct.colors?.join(', ') || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, colors: e.target.value.split(',').map(c => c.trim()).filter(c => c !== '')})}
                    placeholder="Noir, Blanc, #FF0000"
                    className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 italic">Entrez des noms de couleurs ou des codes hexadécimaux.</p>
                </div>

                  <div className="flex gap-4 pt-4">
                    <EnregistrerButton 
                      onClick={async () => {
                        try {
                          if (editingProduct.id) {
                            const { id, ...data } = editingProduct as any;
                            try {
                              await updateDoc(doc(db, 'products', id), data);
                            } catch (error) {
                              handleFirestoreError(error, OperationType.WRITE, `products/${id}`);
                            }
                          } else {
                            try {
                              await addDoc(collection(db, 'products'), {
                                ...editingProduct,
                                rating: 5,
                                reviewCount: 0,
                                features: editingProduct.features || [],
                                images: editingProduct.images || [editingProduct.image]
                              });
                            } catch (error) {
                              handleFirestoreError(error, OperationType.WRITE, 'products');
                            }
                          }
                          setIsAddingProduct(false);
                          showNotification('Produit enregistré avec succès');
                        } catch (err: any) {
                          console.error(err);
                          const message = err.message?.includes('permission') 
                            ? 'Erreur de permission : Vérifiez que vous êtes bien connecté.'
                            : 'Erreur lors de l\'enregistrement du produit. Veuillez réessayer.';
                          showNotification(message, 'error');
                        }
                      }}
                      label="Enregistrer"
                    />
                    <button 
                      onClick={() => setIsAddingProduct(false)}
                      className="px-8 py-4 rounded-xl font-black uppercase tracking-widest text-gray-400 hover:bg-gray-100"
                    >
                      Annuler
                    </button>
                  </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductDetail: React.FC<{ 
  product: Product, 
  products: Product[], 
  onBack: () => void, 
  onAddToCart: (p: Product, q?: number, color?: string) => void, 
  onSelectProduct: (p: Product) => void, 
  settings: SiteSettings,
  showNotification: (m: string, t?: 'success' | 'error') => void,
  initialIsOrdering?: boolean,
  handleShare: (p: Product) => void,
  formatPrice: (p: number) => string
}> = ({ product, products, onBack, onAddToCart, onSelectProduct, settings, showNotification, initialIsOrdering = false, handleShare, formatPrice }) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(product.colors?.[0] || null);
  const [activeTab, setActiveTab] = useState('description');
  const [currentImage, setCurrentImage] = useState(0);
  const [isOrdering, setIsOrdering] = useState(initialIsOrdering);
  const [orderForm, setOrderForm] = useState({
    name: '',
    phone: '',
    city: 'Douala',
    address: '',
    paymentMethod: 'cash_on_delivery' as 'cash_on_delivery' | 'mobile_money' | 'card' | 'paypal'
  });

  const paymentMethods = [
    {
      id: 'cash_on_delivery',
      title: 'Paiement à la livraison',
      description: 'Payez en espèces lors de la réception de votre colis.',
      icon: <Banknote size={20} className="text-oraimo-green" />
    },
    {
      id: 'mobile_money',
      title: 'Mobile Money (Orange/MTN)',
      description: 'Paiement sécurisé via Orange Money ou MTN Mobile Money.',
      icon: <Smartphone size={20} className="text-orange-500" />
    },
    {
      id: 'paypal',
      title: 'PayPal',
      description: 'Paiement sécurisé via PayPal.',
      icon: <CreditCard size={20} className="text-blue-600" />
    },
    {
      id: 'card',
      title: 'Carte Bancaire',
      description: 'Payez par carte Visa ou Mastercard.',
      icon: <CreditCard size={20} className="text-blue-500" />
    }
  ];

  const images = product.images || [product.image];

  const handlePlaceOrder = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!orderForm.name || !orderForm.phone || !orderForm.address) {
      showNotification('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    setIsOrdering(true);
    try {
      // Simulate payment processing for non-COD methods
      if (orderForm.paymentMethod !== 'cash_on_delivery') {
        // Here you would normally call the payment aggregator's API
        // based on settings.paymentAggregator
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (settings.paymentAggregator === 'none') {
          showNotification('Aucun agrégateur de paiement configuré. La commande sera traitée comme Paiement à la Livraison.', 'error');
        } else {
          showNotification(`Redirection vers ${settings.paymentAggregator.toUpperCase()}...`, 'success');
          // In a real app, you would redirect here:
          // window.location.href = paymentUrl;
        }
      }

      const orderData: Omit<Order, 'id'> = {
        customerName: orderForm.name,
        customerPhone: orderForm.phone,
        deliveryAddress: orderForm.address,
        city: orderForm.city,
        items: [{
          productId: product.id,
          name: product.name,
          quantity: quantity,
          price: product.price,
          color: selectedColor || undefined
        }],
        totalAmount: product.price * quantity,
        status: 'pending',
        paymentMethod: orderForm.paymentMethod,
        paymentStatus: 'pending',
        createdAt: serverTimestamp()
      };

      try {
        await addDoc(collection(db, 'orders'), orderData);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'orders');
      }
      showNotification('Commande passée avec succès ! Nous vous contacterons bientôt.');
      setIsOrdering(false);
      onBack();
    } catch (error) {
      console.error('Error placing order:', error);
      showNotification('Une erreur est survenue. Veuillez réessayer.', 'error');
      setIsOrdering(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [product]);

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Sticky Sub-header */}
      <div className="sticky top-[64px] z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="container h-14 flex items-center justify-between">
          <h2 className="text-sm font-black text-oraimo-black uppercase tracking-tight truncate max-w-[200px]">
            {product.name}
          </h2>
          <div className="flex h-full">
            <button 
              onClick={() => {
                setActiveTab('description');
                document.getElementById('product-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`px-4 h-full text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'description' ? 'border-oraimo-green text-oraimo-green' : 'border-transparent text-gray-400'}`}
            >
              Description
            </button>
            <button 
              onClick={() => {
                setActiveTab('reviews');
                document.getElementById('product-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`px-4 h-full text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'reviews' ? 'border-oraimo-green text-oraimo-green' : 'border-transparent text-gray-400'}`}
            >
              Avis des clients
            </button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-8">
          <button onClick={onBack} className="hover:text-oraimo-green">Accueil</button>
          <ChevronRight size={12} />
          <span className="text-gray-600">{product.category}</span>
          <ChevronRight size={12} />
          <span className="text-oraimo-black truncate max-w-[150px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-[#F5F5F5] rounded-2xl overflow-hidden relative">
              <img 
                src={images[currentImage]} 
                alt={product.name} 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <button className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md text-gray-400 hover:text-oraimo-green">
                <Heart size={20} />
              </button>
              <button 
                onClick={() => handleShare(product)}
                className="absolute bottom-4 right-4 p-2 bg-white rounded-full shadow-md text-gray-400 hover:text-oraimo-green"
              >
                <Share2 size={20} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${currentImage === idx ? 'border-oraimo-green' : 'border-transparent bg-[#F5F5F5]'}`}
                >
                  <img 
                    src={img} 
                    alt={`${product.name} - Vue ${idx + 1}`} 
                    className="w-full h-full object-contain" 
                    referrerPolicy="no-referrer" 
                    loading="lazy" 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} className={`${s <= Math.floor(product.rating) ? 'fill-oraimo-green text-oraimo-green' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-400">{product.rating} ({product.reviewCount} Avis)</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-oraimo-black uppercase tracking-tight mb-4 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-3xl font-black text-oraimo-black tracking-tighter">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-gray-400 line-through font-bold">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {product.colors && product.colors.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Couleur</h4>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${selectedColor === color ? 'border-oraimo-green scale-110 shadow-lg' : 'border-gray-100 hover:border-gray-300'}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    >
                      {selectedColor === color && (
                        <CheckCircle size={16} className={['#ffffff', '#fff', 'white'].includes(color.toLowerCase()) ? 'text-black' : 'text-white'} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Caractéristiques principales</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                    <div className="w-8 h-8 bg-[#F5F5F5] rounded-lg flex items-center justify-center text-oraimo-green">
                      <CheckCircle size={16} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantity Selector */}
            <div className="mb-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Quantité</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-200 rounded-full px-4 py-2">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 hover:text-oraimo-green">
                    <Minus size={18} />
                  </button>
                  <span className="w-12 text-center font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="p-1 hover:text-oraimo-green">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Actions (Visible only on small screens) */}
            <div className="lg:hidden flex flex-col gap-3 mt-8">
              <button 
                onClick={() => onAddToCart(product, quantity, selectedColor || undefined)}
                className="w-full bg-white border border-oraimo-black text-oraimo-black py-4 rounded-full font-bold text-sm transition-all hover:bg-gray-50"
              >
                Ajouter au panier
              </button>
              <button 
                onClick={() => setIsOrdering(true)}
                className="w-full bg-oraimo-black text-white py-4 rounded-full font-bold text-sm transition-all hover:bg-opacity-90 shadow-lg"
              >
                Acheter maintenant
              </button>
              <button 
                onClick={() => window.open(`https://wa.me/${settings.whatsapp}?text=Bonjour, je souhaite commander le produit : ${product.name}${selectedColor ? ` (Couleur: ${selectedColor})` : ''} (${product.price} FCFA)`, '_blank')}
                className="w-full bg-[#25D366] text-white py-4 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                <MessageCircle size={20} />
                WhatsApp
              </button>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex flex-col gap-4">
              <div className="flex gap-4">
                <button 
                  onClick={() => onAddToCart(product, quantity, selectedColor || undefined)}
                  className="flex-1 bg-white border border-oraimo-black text-oraimo-black py-4 rounded-full font-bold text-sm transition-all hover:bg-gray-50"
                >
                  Ajouter au panier
                </button>
                <button 
                  onClick={() => setIsOrdering(true)}
                  className="flex-1 bg-oraimo-black text-white py-4 rounded-full font-bold text-sm transition-all hover:bg-opacity-90 shadow-lg"
                >
                  Acheter maintenant
                </button>
              </div>
              <button 
                onClick={() => window.open(`https://wa.me/${settings.whatsapp}?text=Bonjour, je souhaite commander le produit : ${product.name}${selectedColor ? ` (Couleur: ${selectedColor})` : ''} (${product.price} FCFA)`, '_blank')}
                className="w-full bg-[#25D366] text-white py-4 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                <MessageCircle size={20} />
                Commander via WhatsApp
              </button>
            </div>

            {/* Buy Now Form */}
            <AnimatePresence>
              {isOrdering && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-8 bg-gray-50 p-6 rounded-2xl overflow-hidden"
                >
                  <h3 className="text-lg font-black uppercase mb-6">Informations de livraison</h3>
                  <form onSubmit={handlePlaceOrder} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Nom complet</label>
                      <input 
                        required
                        type="text" 
                        value={orderForm.name}
                        onChange={(e) => setOrderForm({...orderForm, name: e.target.value})}
                        className="w-full bg-white border border-gray-100 rounded-xl p-3 font-bold text-sm"
                        placeholder="Ex: Jean Dupont"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Téléphone</label>
                      <input 
                        required
                        type="tel" 
                        value={orderForm.phone}
                        onChange={(e) => setOrderForm({...orderForm, phone: e.target.value})}
                        className="w-full bg-white border border-gray-100 rounded-xl p-3 font-bold text-sm"
                        placeholder="Ex: 6XX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Ville</label>
                      <select 
                        value={orderForm.city}
                        onChange={(e) => setOrderForm({...orderForm, city: e.target.value})}
                        className="w-full bg-white border border-gray-100 rounded-xl p-3 font-bold text-sm"
                      >
                        <option value="Douala">Douala</option>
                        <option value="Yaoundé">Yaoundé</option>
                        <option value="Bafoussam">Bafoussam</option>
                        <option value="Garoua">Garoua</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Adresse de livraison</label>
                      <textarea 
                        required
                        value={orderForm.address}
                        onChange={(e) => setOrderForm({...orderForm, address: e.target.value})}
                        className="w-full bg-white border border-gray-100 rounded-xl p-3 font-bold text-sm h-24"
                        placeholder="Quartier, rue, point de repère..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Mode de paiement</label>
                      <div className="grid grid-cols-1 gap-3">
                        {paymentMethods.map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setOrderForm({ ...orderForm, paymentMethod: method.id as any })}
                            className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                              orderForm.paymentMethod === method.id 
                                ? 'border-oraimo-green bg-oraimo-green/5' 
                                : 'border-gray-100 bg-white hover:bg-gray-50'
                            }`}
                          >
                            <div className={`p-2 rounded-xl ${orderForm.paymentMethod === method.id ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                              {method.icon}
                            </div>
                            <div>
                              <p className="text-sm font-black text-oraimo-black">{method.title}</p>
                              <p className="text-[10px] text-gray-400 font-bold leading-tight mt-1">{method.description}</p>
                            </div>
                            {orderForm.paymentMethod === method.id && (
                              <div className="ml-auto">
                                <CheckCircle size={16} className="text-oraimo-green" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Payment Instructions */}
                      {orderForm.paymentMethod === 'mobile_money' && (
                        <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100 animate-in fade-in slide-in-from-top-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-2">Instructions de paiement</p>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span>MTN Mobile Money:</span>
                              <span className="text-oraimo-black">{settings.mtnNumber || '+237 672 175 723'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span>Orange Money:</span>
                              <span className="text-oraimo-black">{settings.orangeNumber || '+237 699 932 926'}</span>
                            </div>
                          </div>
                          <p className="text-[9px] text-orange-400 mt-3 italic">Veuillez envoyer le montant total et nous contacter avec la preuve de paiement.</p>
                        </div>
                      )}

                      {orderForm.paymentMethod === 'paypal' && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Instructions PayPal</p>
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span>Email PayPal:</span>
                            <span className="text-oraimo-black">{settings.paypalEmail || 'joellmikamm@gmail.com'}</span>
                          </div>
                          <p className="text-[9px] text-blue-400 mt-3 italic">Veuillez envoyer le paiement à cette adresse email.</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <EnregistrerButton 
                        onClick={handlePlaceOrder}
                        label={orderForm.paymentMethod === 'cash_on_delivery' ? 'Confirmer la commande' : 'Procéder au paiement'}
                      />
                      <button 
                        type="button"
                        onClick={() => setIsOrdering(false)}
                        className="px-6 py-4 bg-white border border-gray-200 rounded-xl font-black uppercase tracking-widest text-xs text-gray-400"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content Section */}
        <div id="product-content" className="pt-8">
          {activeTab === 'description' ? (
            <div className="space-y-0">
              {/* Sales Content Style */}
              <div className="max-w-none prose prose-slate prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-p:text-gray-600 prose-p:leading-relaxed prose-p:font-normal prose-img:w-full prose-img:rounded-none prose-img:my-0">
                {product.description ? (
                  <div className="space-y-12">
                    {/* Replicating the "Sales Text" style from screenshots */}
                    <div className="text-center px-4 py-12 bg-white">
                      <h2 className="text-xl md:text-2xl font-black mb-4">Chargez rapidement deux appareils simultanément</h2>
                      <p className="max-w-2xl mx-auto text-sm text-gray-500">
                        Prend en charge la charge ultra-rapide de 35W pour deux appareils à la fois. Il peut charger un iPhone 17 Air ou un Samsung Galaxy S24 à 50% en seulement 30 minutes.
                      </p>
                    </div>
                    
                    <div className="w-full aspect-[16/9] bg-black overflow-hidden">
                      <img 
                        src="https://picsum.photos/seed/oraimo-power/1200/675" 
                        alt="Sales Feature" 
                        className="w-full h-full object-cover opacity-90"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="text-center px-4 py-12 bg-white">
                      <h2 className="text-xl md:text-2xl font-black mb-4">Double entrée, charge plus rapide</h2>
                      <p className="max-w-2xl mx-auto text-sm text-gray-500">
                        Doté d'une double entrée de charge, il réduit le temps de recharge automatique jusqu'à 50% par rapport aux produits à simple entrée, réduisant considérablement le temps d'attente.
                      </p>
                    </div>

                    <div className="w-full aspect-[16/9] bg-[#1A1A1A] overflow-hidden">
                      <img 
                        src="https://picsum.photos/seed/oraimo-input/1200/675" 
                        alt="Sales Feature" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="px-4 py-12">
                      <ReactMarkdown>
                        {product.description}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 leading-relaxed text-base px-4">
                    Aucune description détaillée disponible pour le moment.
                  </p>
                )}
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
                  <div>
                    <h4 className="font-black uppercase text-sm mb-4">Paramètres du produit</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                      <li className="flex justify-between border-b border-gray-50 py-2"><span>Modèle</span> <span className="font-bold text-oraimo-black">OEB-E104D</span></li>
                      <li className="flex justify-between border-b border-gray-50 py-2"><span>Version BT</span> <span className="font-bold text-oraimo-black">V5.3</span></li>
                      <li className="flex justify-between border-b border-gray-50 py-2"><span>Portée</span> <span className="font-bold text-oraimo-black">10m</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Review Summary Header */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-50">
                <h3 className="text-sm font-black uppercase tracking-widest mb-8">Avis des clients</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Note globale</p>
                    <div className="flex items-center gap-4">
                      <span className="text-5xl font-black tracking-tighter">{product.rating.toFixed(1)}</span>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={16} className={`${s <= Math.floor(product.rating) ? 'fill-oraimo-green text-oraimo-green' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-gray-400">({product.reviewCount})</span>
                      </div>
                      <button className="ml-auto text-xs font-black uppercase tracking-widest text-oraimo-black border-b border-oraimo-black pb-1">
                        Ajoutez votre avis &gt;
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-4">
                        <div className="flex items-center gap-1 w-20">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={10} className={`${s <= rating ? 'fill-oraimo-green text-oraimo-green' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-oraimo-green/30" 
                            style={{ width: rating === 5 ? '80%' : rating === 4 ? '15%' : '0%' }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 w-4">0</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-50 pb-8">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-black text-oraimo-black">{review.user}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={12} className={`${s <= review.rating ? 'fill-oraimo-green text-oraimo-green' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 font-bold">{review.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400 font-bold">Aucun avis pour le moment.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      <div className="py-16 border-t border-gray-100 container">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Vous pourrez aussi aimer</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {products.filter(p => p.id !== product.id).slice(0, 4).map((p) => (
            <ProductCard 
              key={p.id} 
              product={p} 
              settings={settings}
              formatPrice={formatPrice}
              onClick={() => navigate(`/product/${p.id}`)} 
              onAddToCart={(e) => { e.stopPropagation(); onAddToCart(p); }} 
              onBuyNow={(e) => { e.stopPropagation(); navigate(`/product/${p.id}`, { state: { openOrderForm: true } }); }}
            />
          ))}
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 p-4 lg:hidden">
        <div className="flex gap-3">
          <button 
            onClick={() => onAddToCart(product, quantity, selectedColor || undefined)}
            className="flex-1 bg-white border border-oraimo-black text-oraimo-black py-3 rounded-full font-bold text-sm transition-all hover:bg-gray-50"
          >
            Ajouter au panier
          </button>
          <button 
            onClick={() => setIsOrdering(true)}
            className="flex-1 bg-oraimo-black text-white py-3 rounded-full font-bold text-sm transition-all hover:bg-opacity-90 shadow-lg"
          >
            Acheter maintenant
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductCard: React.FC<{ 
  product: Product, 
  onClick: () => void, 
  onAddToCart: (e: React.MouseEvent) => void, 
  onBuyNow: (e: React.MouseEvent) => void,
  isFlashSale?: boolean,
  settings: SiteSettings,
  formatPrice: (p: number) => string
}> = ({ product, onClick, onAddToCart, onBuyNow, isFlashSale, settings, formatPrice }) => {
  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  return (
    <div 
      onClick={onClick}
      className="flex flex-col h-full cursor-pointer group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* Image Section */}
      <div className="relative aspect-square bg-[#F8F8F8] overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {(product.tag || isFlashSale) && (
            <span className={`text-white text-[10px] font-black px-2.5 py-1 rounded-sm uppercase tracking-widest shadow-sm ${
              product.tag === 'VENTE FLASH' || isFlashSale ? 'bg-[#93C01F]' : 
              product.tag === 'NOUVEAU' ? 'bg-[#93C01F]' : 'bg-black'
            }`}>
              {isFlashSale ? 'VENTE FLASH' : product.tag}
            </span>
          )}
          {discount > 0 && (
            <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-sm uppercase tracking-widest shadow-sm">
              -{discount}%
            </span>
          )}
        </div>

        {/* Rating Overlay */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-sm flex items-center gap-1.5 shadow-sm border border-gray-100">
          <span className="text-[11px] font-black text-oraimo-black leading-none">{product.rating.toFixed(1)}</span>
          <Star size={10} className="fill-oraimo-green text-oraimo-green" />
          <span className="text-[10px] text-gray-400 font-bold leading-none">({product.reviewCount})</span>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex flex-col flex-grow p-4">
        <h3 className="text-[14px] font-bold text-oraimo-black leading-snug mb-4 line-clamp-2 min-h-[2.8rem] group-hover:text-oraimo-green transition-colors">
          {product.name}
        </h3>
        
        {/* Features List */}
        <div className="space-y-0.5 mb-4">
          {product.features.slice(0, 2).map((feature, i) => (
            <div key={i} className="flex items-center gap-2.5 py-2 border-t border-gray-50 first:border-t-0">
              <div className="w-4 h-4 rounded-full bg-oraimo-black flex items-center justify-center flex-shrink-0">
                <Check size={9} className="text-white" />
              </div>
              <span className="text-[11px] text-gray-600 font-medium line-clamp-1">{feature}</span>
            </div>
          ))}
        </div>

        {/* Price Section */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-baseline gap-2">
            <span className="text-[17px] font-black text-oraimo-black tracking-tight">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-[12px] text-gray-400 line-through font-bold">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckoutModal: React.FC<{ cartItems: any[], total: number, onClose: () => void, onSuccess: () => void, showNotification: (m: string, t?: 'success' | 'error') => void, formatPrice: (p: number) => string, settings: SiteSettings }> = ({ cartItems, total, onClose, onSuccess, showNotification, formatPrice, settings }) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: 'Douala',
    address: '',
    paymentMethod: 'cash_on_delivery' as 'cash_on_delivery' | 'mobile_money' | 'card' | 'paypal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMethods = [
    {
      id: 'cash_on_delivery',
      title: 'Paiement à la livraison',
      description: 'Payez en espèces lors de la réception de votre colis.',
      icon: <Banknote size={20} className="text-oraimo-green" />
    },
    {
      id: 'mobile_money',
      title: 'Mobile Money (Orange/MTN)',
      description: 'Paiement sécurisé via Orange Money ou MTN Mobile Money.',
      icon: <Smartphone size={20} className="text-orange-500" />
    },
    {
      id: 'paypal',
      title: 'PayPal',
      description: 'Paiement sécurisé via PayPal.',
      icon: <CreditCard size={20} className="text-blue-600" />
    },
    {
      id: 'card',
      title: 'Carte Bancaire',
      description: 'Payez par carte Visa ou Mastercard.',
      icon: <CreditCard size={20} className="text-blue-500" />
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Simulate payment processing for non-COD methods
      if (form.paymentMethod !== 'cash_on_delivery') {
        // Here you would normally call the payment aggregator's API
        // based on settings.paymentAggregator
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (settings.paymentAggregator === 'none') {
          showNotification('Aucun agrégateur de paiement configuré. La commande sera traitée comme Paiement à la Livraison.', 'error');
        } else {
          showNotification(`Redirection vers ${settings.paymentAggregator.toUpperCase()}...`, 'success');
          // In a real app, you would redirect here:
          // window.location.href = paymentUrl;
        }
      }

      const orderData: Omit<Order, 'id'> = {
        customerName: form.name,
        customerPhone: form.phone,
        deliveryAddress: form.address,
        city: form.city,
        items: cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          color: item.color
        })),
        totalAmount: total,
        status: 'pending',
        paymentMethod: form.paymentMethod,
        paymentStatus: 'pending',
        createdAt: serverTimestamp()
      };

      try {
        await addDoc(collection(db, 'orders'), orderData);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'orders');
      }
      onSuccess();
    } catch (error) {
      console.error('Error placing order:', error);
      showNotification('Une erreur est survenue. Veuillez réessayer.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[150] backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black uppercase tracking-tight">Finaliser la commande</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="mb-8 bg-gray-50 p-4 rounded-2xl">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Résumé</h4>
          <div className="space-y-2">
            {cartItems.map((item, i) => (
              <div key={i} className="flex justify-between text-sm font-bold">
                <span>{item.quantity}x {item.name}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="pt-4 border-t border-gray-200 flex justify-between text-lg font-black">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nom complet</label>
            <input 
              required
              type="text" 
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold text-sm"
              placeholder="Ex: Jean Dupont"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Téléphone</label>
            <input 
              required
              type="tel" 
              value={form.phone}
              onChange={(e) => setForm({...form, phone: e.target.value})}
              className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold text-sm"
              placeholder="Ex: 6XX XXX XXX"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Ville</label>
            <select 
              value={form.city}
              onChange={(e) => setForm({...form, city: e.target.value})}
              className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold text-sm"
            >
              <option value="Douala">Douala</option>
              <option value="Yaoundé">Yaoundé</option>
              <option value="Bafoussam">Bafoussam</option>
              <option value="Garoua">Garoua</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Adresse de livraison</label>
            <textarea 
              required
              value={form.address}
              onChange={(e) => setForm({...form, address: e.target.value})}
              className="w-full bg-gray-50 border-none rounded-xl p-4 font-bold text-sm h-24 resize-none"
              placeholder="Quartier, rue, point de repère..."
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Mode de paiement</label>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: method.id as any })}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    form.paymentMethod === method.id 
                      ? 'border-oraimo-green bg-oraimo-green/5' 
                      : 'border-gray-50 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${form.paymentMethod === method.id ? 'bg-white shadow-sm' : 'bg-white/50'}`}>
                    {method.icon}
                  </div>
                  <div>
                    <p className="text-sm font-black text-oraimo-black">{method.title}</p>
                    <p className="text-[10px] text-gray-400 font-bold leading-tight mt-1">{method.description}</p>
                  </div>
                  {form.paymentMethod === method.id && (
                    <div className="ml-auto">
                      <CheckCircle size={16} className="text-oraimo-green" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Payment Instructions */}
            {form.paymentMethod === 'mobile_money' && (
              <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100 animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-2">Instructions de paiement</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>MTN Mobile Money:</span>
                    <span className="text-oraimo-black">{settings.mtnNumber || '+237 672 175 723'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Orange Money:</span>
                    <span className="text-oraimo-black">{settings.orangeNumber || '+237 699 932 926'}</span>
                  </div>
                </div>
                <p className="text-[9px] text-orange-400 mt-3 italic">Veuillez envoyer le montant total et nous contacter avec la preuve de paiement.</p>
              </div>
            )}

            {form.paymentMethod === 'paypal' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Instructions PayPal</p>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>Email PayPal:</span>
                  <span className="text-oraimo-black">{settings.paypalEmail || 'joellmikamm@gmail.com'}</span>
                </div>
                <p className="text-[9px] text-blue-400 mt-3 italic">Veuillez envoyer le paiement à cette adresse email.</p>
              </div>
            )}
          </div>
          <button 
            disabled={isSubmitting}
            type="submit"
            className="w-full bg-oraimo-green text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-oraimo-green/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Traitement...' : form.paymentMethod === 'cash_on_delivery' ? 'Confirmer la commande' : 'Procéder au paiement'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const FooterColumn: React.FC<{ title: string, links: string[] }> = ({ title, links }) => (
  <div>
    <h4 className="font-black uppercase text-xs tracking-widest mb-6 flex items-center justify-between md:block">
      {title}
      <ChevronDown size={16} className="md:hidden" />
    </h4>
    <ul className="hidden md:block space-y-4 text-gray-500 font-medium text-xs">
      {links.map(link => (
        <li key={link}>
          {link === 'Administration' ? (
            <Link to="/admin" className="hover:text-oraimo-green transition-colors">{link}</Link>
          ) : (
            <a href="#" className="hover:text-oraimo-green transition-colors">{link}</a>
          )}
        </li>
      ))}
    </ul>
  </div>
);

export default App;
