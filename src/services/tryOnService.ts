export interface TryOnItem {
  id: string;
  name: string;
  category: 'top' | 'bottom' | 'accessory' | 'full';
  imageUrl: string;
  description: string;
  isCustom?: boolean;
}

export const TRY_ON_ITEMS: TryOnItem[] = [
  // TOPS
  {
    id: 'top-1',
    name: 'Neon Pulse Jacket',
    category: 'top',
    imageUrl: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=400&h=600',
    description: 'A futuristic jacket with glowing fiber-optic seams.'
  },
  {
    id: 'top-2',
    name: 'Void Hoodie',
    category: 'top',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400&h=600',
    description: 'Deep black oversized hoodie with holographic accents.'
  },
  {
    id: 'top-3',
    name: 'Cyber Mesh Tee',
    category: 'top',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=400&h=600',
    description: 'Breathable tech-mesh t-shirt with reflective branding.'
  },
  // BOTTOMS
  {
    id: 'bottom-1',
    name: 'Matrix Joggers',
    category: 'bottom',
    imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=400&h=600',
    description: 'Techwear joggers with integrated LED strips.'
  },
  {
    id: 'bottom-2',
    name: 'Glitch Skirt',
    category: 'bottom',
    imageUrl: 'https://images.unsplash.com/photo-1577900232427-18219b9166a0?auto=format&fit=crop&q=80&w=400&h=600',
    description: 'Iridescent pleated skirt with digital pattern.'
  },
  {
    id: 'bottom-3',
    name: 'Carbon Cargoes',
    category: 'bottom',
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=400&h=600',
    description: 'Ultra-durable carbon fiber reinforced cargo pants.'
  },
  // ACCESSORIES
  {
    id: 'acc-1',
    name: 'Neural Visor',
    category: 'accessory',
    imageUrl: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=400&h=400',
    description: 'Augmented reality eyewear with purple tint.'
  },
  {
    id: 'acc-2',
    name: 'Gravity Boots',
    category: 'accessory',
    imageUrl: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=400&h=400',
    description: 'Heavy-duty boots with magnetic suspension soles.'
  },
  {
    id: 'acc-3',
    name: 'Cyber Pack',
    category: 'accessory',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400&h=400',
    description: 'Sleek hardshell backpack with solar charging panels.'
  },
  // FULL BODY
  {
    id: 'full-1',
    name: 'Nebula Gown',
    category: 'full',
    imageUrl: 'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&q=80&w=400&h=600',
    description: 'A flowing dress that shifts colors like a distant galaxy.'
  },
  {
    id: 'full-2',
    name: 'Titan Exosuit',
    category: 'full',
    imageUrl: 'https://images.unsplash.com/photo-1558484629-456ca0edd140?auto=format&fit=crop&q=80&w=400&h=600',
    description: 'Full body protective suit with chrome plating.'
  },
  {
    id: 'full-3',
    name: 'Zenith Jumpsuit',
    category: 'full',
    imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=400&h=600',
    description: 'Minimalist one-piece suit with adaptive thermal control.'
  }
];

export const SAMPLE_USER_PHOTOS = [
  {
    id: 'sample-user-1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800&h=1200',
    label: 'Model A'
  },
  {
    id: 'sample-user-2',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800&h=1200',
    label: 'Model B'
  },
  {
    id: 'sample-user-3',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800&h=1200',
    label: 'Model C'
  }
];

export interface TryOnResponse {
  resultImage: string | null;
  error?: string;
  isRateLimit?: boolean;
  retryAfter?: number;
}

export async function processTryOn(userImage: string, item: TryOnItem, customGarment?: string): Promise<TryOnResponse> {
  try {
    // Add cache-busting query param to bypass any edge caching
    const timestamp = Date.now();
    const response = await fetch(`/api/try-on?t=${timestamp}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userImage, item, customGarment }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const rawError = errorData.error;
      let errorMessage = 'Failed to process try-on.';
      
      if (typeof rawError === 'string') {
        errorMessage = rawError;
      } else if (rawError && typeof rawError === 'object') {
        errorMessage = rawError.message || JSON.stringify(rawError);
      }

      console.error("Try-on processing failed:", errorMessage);
      
      const isRateLimit = response.status === 429 || 
                          errorMessage.toLowerCase().includes('quota') || 
                          errorMessage.toLowerCase().includes('resource_exhausted');

      if (isRateLimit) {
        errorMessage = "The AI is currently busy due to high demand (Free Tier limit reached). Please wait about 60 seconds and try again. Tip: Try using a different photo or a simpler item.";
      } else if (response.status === 504) {
        errorMessage = "The request timed out. The AI took too long to process. Try a smaller photo.";
      } else if (response.status === 413) {
        errorMessage = "The image is too large. Please try a smaller photo.";
      } else if (response.status === 500) {
        errorMessage = "The AI server is having trouble. This might be temporary, please try again.";
      }

      return { 
        resultImage: null, 
        error: errorMessage, 
        isRateLimit
      };
    }

    const data = await response.json();
    return { resultImage: data.resultImage };
  } catch (error) {
    console.error("Try-on processing failed:", error);
    return { resultImage: null, error: "Network error. Please try again." };
  }
}
