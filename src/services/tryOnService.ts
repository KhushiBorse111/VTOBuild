import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

export async function processTryOn(userImageBase64: string, item: TryOnItem, customGarmentBase64?: string): Promise<string | null> {
  try {
    const parts: any[] = [
      {
        inlineData: {
          data: userImageBase64.split(',')[1],
          mimeType: 'image/png',
        },
      },
    ];

    if (item.isCustom && customGarmentBase64) {
      parts.push({
        inlineData: {
          data: customGarmentBase64.split(',')[1],
          mimeType: 'image/png',
        },
      });
      parts.push({
        text: `This is a photo of a person and a photo of a garment. Please virtually overlay the garment from the second photo onto the person in the first photo. Ensure the garment fits naturally on their body. Maintain the original person's features and background while seamlessly integrating the new clothing. The final image should look like a real photo of them wearing the garment.`,
      });
    } else {
      parts.push({
        text: `This is a photo of a person. Please virtually overlay this item: "${item.name}" (${item.description}) onto the person in the photo. Ensure the item fits naturally on their body/face. Maintain the original person's features and background while seamlessly integrating the new clothing/accessory. The final image should look like a real photo of them wearing the item.`,
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Try-on processing failed:", error);
    return null;
  }
}
