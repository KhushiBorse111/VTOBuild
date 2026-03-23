import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Route for Try-On
  app.post("/api/try-on", async (req, res) => {
    try {
      const { userImage, item, customGarment } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const parts: any[] = [];

      // Helper to handle base64 or URL
      const getImageData = async (input: string) => {
        if (input.startsWith('data:')) {
          return input.split(',')[1];
        } else {
          const response = await fetch(input);
          const buffer = await response.arrayBuffer();
          return Buffer.from(buffer).toString('base64');
        }
      };

      const userImageData = await getImageData(userImage);
      parts.push({
        inlineData: {
          data: userImageData,
          mimeType: 'image/png',
        },
      });

      if (item.isCustom && customGarment) {
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

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
      });

      if (!response.candidates?.[0]?.content?.parts) {
        return res.status(500).json({ error: "AI returned an empty response." });
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return res.json({ resultImage: `data:image/png;base64,${part.inlineData.data}` });
        }
      }

      res.status(500).json({ error: "No image data found in AI response." });
    } catch (error: any) {
      console.error("Server-side try-on failed:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
