/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Sparkles, RefreshCw, Download, X, Check, User, Heart, Trash2, Shirt, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TRY_ON_ITEMS, TryOnItem, processTryOn, SAMPLE_USER_PHOTOS } from './services/tryOnService';

interface SavedOutfit {
  id: string;
  imageUrl: string;
  itemName: string;
  timestamp: number;
}

export default function App() {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [customGarment, setCustomGarment] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<TryOnItem | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [view, setView] = useState<'home' | 'profile'>('home');
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);

  // Load saved outfits from local storage
  useEffect(() => {
    const stored = localStorage.getItem('celestique_outfits');
    if (stored) {
      setSavedOutfits(JSON.parse(stored));
    }
  }, []);

  // Save outfits to local storage
  const saveOutfit = () => {
    if (!resultImage || !selectedItem) return;
    const newOutfit: SavedOutfit = {
      id: Date.now().toString(),
      imageUrl: resultImage,
      itemName: selectedItem.name,
      timestamp: Date.now(),
    };
    const updated = [newOutfit, ...savedOutfits];
    setSavedOutfits(updated);
    localStorage.setItem('celestique_outfits', JSON.stringify(updated));
    alert("Outfit saved to your profile!");
  };

  const deleteOutfit = (id: string) => {
    const updated = savedOutfits.filter(o => o.id !== id);
    setSavedOutfits(updated);
    localStorage.setItem('celestique_outfits', JSON.stringify(updated));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImage(reader.result as string);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGarmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCustomGarment(base64);
        const customItem: TryOnItem = {
          id: 'custom-' + Date.now(),
          name: 'Custom Garment',
          category: 'full',
          imageUrl: base64,
          description: 'User uploaded custom garment.',
          isCustom: true
        };
        setSelectedItem(customItem);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setUserImage(dataUrl);
        setResultImage(null);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleTryOn = async () => {
    if (!userImage || !selectedItem) return;

    setIsProcessing(true);
    const result = await processTryOn(userImage, selectedItem, customGarment || undefined);
    if (result) {
      setResultImage(result);
    } else {
      alert("Failed to process try-on. Please try again.");
    }
    setIsProcessing(false);
  };

  const downloadResult = (img?: string) => {
    const target = img || resultImage;
    if (!target) return;
    const link = document.createElement('a');
    link.href = target;
    link.download = `celestique-tryon-${Date.now()}.png`;
    link.click();
  };

  const resetUserImage = () => {
    setUserImage(null);
    setResultImage(null);
    setSelectedItem(null);
    setCustomGarment(null);
  };

  const filteredItems = activeCategory === 'All' 
    ? TRY_ON_ITEMS 
    : TRY_ON_ITEMS.filter(item => item.category.toLowerCase() === activeCategory.toLowerCase());

  const categoryIcons: Record<string, any> = {
    'All': Sparkles,
    'Top': Shirt,
    'Bottom': Shirt, // Using shirt as placeholder for bottom
    'Accessory': Sparkles,
    'Full': User
  };

  return (
    <div className="min-h-screen bg-deep-space flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 glass-panel z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-8 h-8 bg-neon-purple rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(188,19,254,0.5)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter neon-glow">CELESTIQUE</h1>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setView('home')}
            className={`text-sm font-bold uppercase tracking-widest transition-colors ${view === 'home' ? 'text-neon-purple' : 'text-white/60 hover:text-white'}`}
          >
            Studio
          </button>
          <button 
            onClick={() => setView('profile')}
            className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${view === 'profile' ? 'text-neon-purple' : 'text-white/60 hover:text-white'}`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {view === 'home' ? (
          <>
            {/* Left: Preview Area */}
            <section className="flex-1 relative bg-black/40 flex items-center justify-center p-4 lg:p-12 overflow-hidden">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#bc13fe33,transparent_70%)]" />
                <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
              </div>

              <div className="relative w-full max-w-2xl aspect-[3/4] neon-border rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center group">
                <AnimatePresence mode="wait">
                  {!userImage && !showCamera && (
                    <motion.div 
                      key="upload-prompt"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="text-center p-8 w-full max-w-md"
                    >
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                        <Camera className="w-10 h-10 text-white/40" />
                      </div>
                      <h2 className="text-2xl font-semibold mb-2">Ready for your transformation?</h2>
                      <p className="text-white/40 mb-8 max-w-xs mx-auto">Upload a photo, use your camera, or pick a sample model.</p>
                      
                      <div className="flex flex-col gap-4 mb-8">
                        <div className="flex gap-4 justify-center">
                          <button 
                            onClick={startCamera}
                            className="flex-1 px-4 py-3 bg-neon-purple hover:bg-neon-purple/80 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(188,19,254,0.3)]"
                          >
                            <Camera className="w-5 h-5" /> Camera
                          </button>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-white/10"
                          >
                            <Upload className="w-5 h-5" /> Upload
                          </button>
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileUpload} 
                          className="hidden" 
                          accept="image/*" 
                        />
                      </div>

                      <div className="pt-6 border-t border-white/10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">Or pick a sample</p>
                        <div className="grid grid-cols-3 gap-3">
                          {SAMPLE_USER_PHOTOS.map((photo) => (
                            <button 
                              key={photo.id}
                              onClick={() => setUserImage(photo.url)}
                              className="aspect-[3/4] rounded-lg overflow-hidden border border-white/10 hover:border-neon-purple transition-all group"
                            >
                              <img src={photo.url} alt={photo.label} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {showCamera && (
                    <motion.div 
                      key="camera-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col"
                    >
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
                        <button 
                          onClick={stopCamera}
                          className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                        >
                          <X className="w-6 h-6" />
                        </button>
                        <button 
                          onClick={capturePhoto}
                          className="w-16 h-16 rounded-full bg-neon-purple p-1 shadow-[0_0_20px_rgba(188,19,254,0.5)]"
                        >
                          <div className="w-full h-full rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-10 h-10 bg-white rounded-full" />
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {userImage && !showCamera && (
                    <motion.div 
                      key="preview-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0"
                    >
                      <img src={resultImage || userImage} alt="User Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center scanline">
                          <RefreshCw className="w-12 h-12 text-neon-purple animate-spin mb-4" />
                          <p className="text-xl font-bold tracking-widest neon-glow">PROCESSING NEURAL MESH...</p>
                        </div>
                      )}

                      {!isProcessing && (
                        <div className="absolute top-4 right-4 flex gap-2">
                          {resultImage && (
                            <>
                              <button 
                                onClick={saveOutfit}
                                className="p-3 bg-neon-pink rounded-full text-white shadow-lg hover:scale-110 transition-transform"
                                title="Save to Profile"
                              >
                                <Heart className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => downloadResult()}
                                className="p-3 bg-neon-purple rounded-full text-white shadow-lg hover:scale-110 transition-transform"
                                title="Download Result"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={resetUserImage}
                            className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white shadow-lg hover:scale-110 transition-transform border border-white/20"
                            title="Reload / Change Photo"
                          >
                            <RefreshCw className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <canvas ref={canvasRef} className="hidden" />
            </section>

            {/* Right: Sidebar Gallery */}
            <aside className="w-full lg:w-[400px] border-l border-white/10 glass-panel flex flex-col z-40">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/50 mb-4 text-center">Wardrobe</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {['All', 'Top', 'Bottom', 'Accessory', 'Full'].map((cat) => {
                    const Icon = categoryIcons[cat] || Sparkles;
                    return (
                      <button 
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-xl border flex flex-col items-center gap-1 min-w-[70px] transition-all ${
                          activeCategory === cat ? 'border-neon-purple bg-neon-purple/10 text-white shadow-[0_0_10px_rgba(188,19,254,0.2)]' : 'border-white/10 text-white/40 hover:border-white/30'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 no-scrollbar">
                {/* Custom Garment Upload Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => garmentInputRef.current?.click()}
                  className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 ${
                    selectedItem?.isCustom ? 'border-neon-purple bg-neon-purple/5' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}
                >
                  {customGarment ? (
                    <>
                      <img src={customGarment} alt="Custom" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <RefreshCw className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Plus className="w-8 h-8 text-white/20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Custom Item</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={garmentInputRef} 
                    onChange={handleGarmentUpload} 
                    className="hidden" 
                    accept="image/*" 
                  />
                </motion.button>

                {filteredItems.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedItem(item); setCustomGarment(null); }}
                    className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                      selectedItem?.id === item.id && !selectedItem.isCustom ? 'border-neon-purple shadow-[0_0_15px_rgba(188,19,254,0.3)]' : 'border-transparent bg-white/5'
                    }`}
                  >
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 text-left">
                      <p className="text-[10px] uppercase tracking-widest text-neon-purple font-bold mb-0.5">{item.category}</p>
                      <p className="text-xs font-bold leading-tight">{item.name}</p>
                    </div>
                    {selectedItem?.id === item.id && !selectedItem.isCustom && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-neon-purple rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="p-6 border-t border-white/10 bg-black/20">
                <button 
                  disabled={!userImage || !selectedItem || isProcessing}
                  onClick={handleTryOn}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                    !userImage || !selectedItem || isProcessing
                      ? 'bg-white/5 text-white/20 cursor-not-allowed'
                      : 'bg-neon-purple text-white shadow-[0_0_30px_rgba(188,19,254,0.4)] hover:shadow-[0_0_40px_rgba(188,19,254,0.6)] active:scale-95'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      Apply Look
                    </>
                  )}
                </button>
              </div>
            </aside>
          </>
        ) : (
          /* Profile View */
          <section className="flex-1 overflow-y-auto p-6 lg:p-12 no-scrollbar">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-4xl font-bold tracking-tighter neon-glow mb-2">USER PROFILE</h2>
                  <p className="text-white/40 uppercase tracking-[0.3em] text-xs">Your virtual collection</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-bold text-white/60">COLLECTION SIZE</p>
                    <p className="text-2xl font-bold text-neon-purple">{savedOutfits.length}</p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-white/20" />
                  </div>
                </div>
              </div>

              {savedOutfits.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-center border-2 border-dashed border-white/10 rounded-3xl">
                  <Shirt className="w-16 h-16 text-white/10 mb-6" />
                  <h3 className="text-xl font-bold mb-2">Your collection is empty</h3>
                  <p className="text-white/40 mb-8">Try on some items in the studio and save them to see them here.</p>
                  <button 
                    onClick={() => setView('home')}
                    className="px-8 py-3 bg-neon-purple text-white rounded-xl font-bold shadow-[0_0_20px_rgba(188,19,254,0.3)]"
                  >
                    Go to Studio
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {savedOutfits.map((outfit) => (
                    <motion.div 
                      key={outfit.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-[3/4] rounded-2xl overflow-hidden neon-border bg-white/5"
                    >
                      <img src={outfit.imageUrl} alt={outfit.itemName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                        <h4 className="text-lg font-bold mb-1">{outfit.itemName}</h4>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-4">
                          {new Date(outfit.timestamp).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => downloadResult(outfit.imageUrl)}
                            className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Download
                          </button>
                          <button 
                            onClick={() => deleteOutfit(outfit.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 border-t border-white/10 flex items-center justify-between px-6 bg-black/40 text-[10px] font-mono text-white/30 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span>Status: {isProcessing ? 'Processing' : 'Ready'}</span>
          <span className="w-1 h-1 bg-neon-purple rounded-full animate-pulse" />
          <span>Neural Engine: Active</span>
        </div>
        <div>
          © 2026 Celestique Digital Fashion
        </div>
      </footer>
    </div>
  );
}
