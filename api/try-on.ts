import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userImage, item, customGarment } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Server Error: GEMINI_API_KEY is missing in environment variables.");
      return res.status(500).json({ error: "API Key is not configured on the server. Please add GEMINI_API_KEY to your Vercel Environment Variables." });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const parts: any[] = [];

    // Helper to handle base64 or URL
    const getImageData = async (input: string) => {
      if (input.startsWith('data:')) {
        return input.split(',')[1];
      } else {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
          
          const response = await fetch(input, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (!response.ok) throw new Error(`Failed to fetch image from URL: ${input} (Status: ${response.status})`);
          const buffer = await response.arrayBuffer();
          return Buffer.from(buffer).toString('base64');
        } catch (fetchError: any) {
          console.error("Image fetch error:", fetchError);
          if (fetchError.name === 'AbortError') {
            throw new Error(`Timeout fetching image from URL: ${input}. The server took too long to respond.`);
          }
          throw new Error(`Could not retrieve image from URL: ${input}. Please try uploading a local file instead.`);
        }
      }
    };

    console.log("Processing user image...");
    const userImageData = await getImageData(userImage);
    parts.push({
      inlineData: {
        data: userImageData,
        mimeType: 'image/png',
      },
    });

    if (item.isCustom && customGarment) {
      console.log("Processing custom garment...");
      const garmentData = await getImageData(customGarment);
      parts.push({
        inlineData: {
          data: garmentData,
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

    console.log("Calling Gemini AI...");
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
      });
    } catch (firstError: any) {
      const errStr = JSON.stringify(firstError).toLowerCase();
      if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('resource_exhausted')) {
        console.log("Gemini 2.5 Rate Limited. Trying fallback to Gemini 3.1...");
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: { parts },
          });
        } catch (secondError: any) {
          throw secondError; // Re-throw if fallback also fails
        }
      } else {
        throw firstError;
      }
    }

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      console.error("AI Error: Empty response from Gemini.", response);
      const finishReason = candidate?.finishReason;
      let errorMsg = "AI returned an empty response.";
      if (finishReason === 'SAFETY') errorMsg = "The request was blocked by AI safety filters. Please try a different image.";
      if (finishReason === 'RECITATION') errorMsg = "The request was blocked due to copyright recitation filters.";
      return res.status(500).json({ error: errorMsg });
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        console.log("Success: Image generated.");
        return res.json({ resultImage: `data:image/png;base64,${part.inlineData.data}` });
      }
    }

    console.error("AI Error: No image data in parts.");
    res.status(500).json({ error: "No image data found in AI response." });
  } catch (error: any) {
    console.error("Try-on API failed:", error);
    
    // Check if it's a quota/rate limit error from Gemini
    const errorString = JSON.stringify(error);
    if (error.status === 429 || error.code === 429 || errorString.includes('429') || errorString.toLowerCase().includes('quota')) {
      return res.status(429).json({ 
        error: "The AI service is currently at its free-tier limit. Please wait 60 seconds and try again." 
      });
    }

    res.status(500).json({ error: error.message || "Internal server error during AI processing." });
  }
}
