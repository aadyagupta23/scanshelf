import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LoaderPinwheel, Camera, X, RotateCcw, Check, BookOpen } from "lucide-react";

interface Book {
  id?: number;
  title: string;
  author: string;
  coverUrl: string;
  isbn?: string;
  metadata?: Record<string, unknown>;
}

interface UploadStepProps {
  onBooksDetected: (books: Book[], imageBase64: string) => void;
  detectedBooks: Book[];
  onGetRecommendations?: (selectedBooks: Book[]) => void;
  onReset?: () => void;
  isLoading?: boolean;
}

function cleanAuthors(authorStr: string): string {
  if (!authorStr) {
    return "Unknown Author";
  }
  const parts = authorStr.split(',').map(p => p.trim());
  const uniqueParts = Array.from(new Set(parts));
  return uniqueParts.join(', ');
}

export default function UploadStep({ onBooksDetected, detectedBooks, onGetRecommendations, onReset, isLoading = false }: UploadStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Track selection of books
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

  useEffect(() => {
    setSelectedIndexes(detectedBooks.map((_, i) => i));
  }, [detectedBooks]);

  const toggleSelect = (index: number) => {
    setSelectedIndexes(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  // Check if device is mobile on component mount
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isMobileDevice || isTouchDevice);
    };
    
    checkIfMobile();
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const startCamera = async () => {
    setCameraLoading(true);
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        const video = videoRef.current;
        video.onloadedmetadata = () => {
          video.play().then(() => {
            setCameraLoading(false);
            setShowCamera(true);
          }).catch(() => {
            setCameraLoading(false);
            toast({
              title: "Camera error",
              description: "Unable to start camera preview. Please try again.",
              variant: "destructive",
            });
          });
        };
        
        // Fallback timeout
        setTimeout(() => {
          if (cameraLoading) {
            setCameraLoading(false);
            setShowCamera(true);
          }
        }, 3000);
      }
    } catch (error) {
      setCameraLoading(false);
      let errorMessage = "Please allow camera access to take photos directly, or use the file upload option.";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Camera access was denied. Please allow camera access and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No camera found on this device.";
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "Camera is not supported on this device.";
        }
      }
      
      toast({
        title: "Camera access error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (cameraStream) {
      stopCamera();
      // Small delay to ensure camera is fully stopped before restarting
      setTimeout(() => {
        setFacingMode(newFacingMode);
        startCamera();
      }, 100);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Camera error",
        description: "Camera is not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      toast({
        title: "Capture error",
        description: "Unable to capture photo. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Check if video has loaded and has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast({
        title: "Camera not ready",
        description: "Please wait for the camera to fully load before taking a photo.",
        variant: "destructive",
      });
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
    
    // Validate that we got a proper image
    if (!base64Image || base64Image === 'data:,') {
      toast({
        title: "Capture failed",
        description: "Failed to capture photo. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Stop camera
    stopCamera();
    
    // Set uploaded image and process
    setUploadedImage(base64Image);
    processImage(base64Image);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;
        setUploadedImage(base64Image);
        setIsUploading(false);
        await processImage(base64Image);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: `Error uploading image: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  const processImage = async (base64Image: string) => {
    setIsProcessing(true);

    try {
      // Create form data
      const formData = new FormData();
      // Get the raw base64 data without the prefix
      const base64Data = base64Image.split(',')[1] || base64Image;
      
      // Create a blob from the base64 data
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      
      for (let i = 0; i < byteCharacters.length; i += 512) {
        const slice = byteCharacters.slice(i, i + 512);
        const byteNumbers = new Array(slice.length);
        
        for (let j = 0; j < slice.length; j++) {
          byteNumbers[j] = slice.charCodeAt(j);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const blob = new Blob(byteArrays, { type: 'image/jpeg' });
      formData.append("image", blob);

      // Send to backend
      const response = await fetch("/api/books/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to analyze image");
      }

      const data = await response.json();

      if (data.books && data.books.length > 0) {
        onBooksDetected(data.books, base64Image);
        toast({
          title: "Books detected!",
          description: `Found ${data.books.length} books in your image`,
        });
      } else {
        toast({
          title: "No books detected",
          description: "We couldn't identify any books in your image. Please try a clearer photo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: `Error analyzing image: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // Check file size and type as in handleFileChange
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);

      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Image = event.target?.result as string;
          setUploadedImage(base64Image);
          setIsUploading(false);
          await processImage(base64Image);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        setIsUploading(false);
        toast({
          title: "Upload failed",
          description: `Error uploading image: ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive",
        });
      }
    }
  };

  // Camera interface component
  if (showCamera || cameraLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <div className="relative w-full h-full">
          {/* Camera feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
          
          {/* Hidden canvas for capturing */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Loading overlay */}
          {cameraLoading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-lg font-medium">Starting camera...</p>
                <p className="text-sm text-white/80 mt-2">Please allow camera access</p>
              </div>
            </div>
          )}
          
          {/* Camera controls */}
          {!cameraLoading && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                {/* Close camera */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={stopCamera}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-6 w-6" />
                </Button>
                
                {/* Capture button */}
                <Button
                  onClick={capturePhoto}
                  size="lg" 
                  className="bg-white hover:bg-gray-200 text-black rounded-full w-16 h-16 p-0"
                >
                  <div className="w-12 h-12 bg-white rounded-full border-4 border-gray-300" />
                </Button>
                
                {/* Switch camera */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={switchCamera}
                  className="text-white hover:bg-white/20"
                >
                  <RotateCcw className="h-6 w-6" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Tips overlay */}
          {!cameraLoading && (
            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent">
              <div className="text-white text-center">
                <h3 className="font-medium mb-2">Position books clearly in frame</h3>
                <p className="text-sm text-white/80">Make sure book titles and authors are visible</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Upload a photo of books</h2>
        <p className="text-gray-600 dark:text-gray-300">Take a photo of a bookshelf or book collection you want recommendations for.</p>
      </div>

      {/* Image upload area */}
      {!detectedBooks.length ? (
        <>
          <div 
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 mb-6 flex flex-col items-center justify-center text-center"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {!isUploading && !isProcessing && !uploadedImage ? (
              <>
                <div className="h-12 w-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                    <line x1="16" x2="22" y1="5" y2="5" />
                    <line x1="19" x2="19" y1="2" y2="8" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Upload a photo</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md">
                  {isMobile ? "Take a photo or choose from your gallery" : "Drag & drop an image here, or click to browse"}
                </p>
                
                {/* Button group for mobile (camera + choose file) */}
                {isMobile ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={startCamera}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Take Photo
                    </Button>
                    <Button 
                      onClick={() => document.getElementById("book-image")?.click()}
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary/10 dark:border-primary/60 dark:text-primary-foreground dark:hover:bg-primary/20"
                    >
                      Choose from Gallery
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Button 
                      onClick={() => document.getElementById("book-image")?.click()}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Choose Image
                    </Button>
                  </div>
                )}
                
                <input 
                  type="file" 
                  id="book-image" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </>
            ) : isUploading ? (
              <div className="py-12 flex flex-col items-center">
                 <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Uploading image...</p>
              </div>
            ) : isProcessing ? (
              <div className="py-8 w-full flex flex-col items-center">
                <p className="text-primary font-semibold text-center mb-6 animate-pulse flex items-center justify-center gap-2 text-lg">
                  <LoaderPinwheel className="h-5 w-5 animate-spin text-primary" />
                  Analyzing bookshelf image...
                </p>
                
                {/* Skeleton Book Shelf */}
                <div className="border-b-8 border-primary dark:border-primary/80 w-full max-w-md flex items-end justify-center gap-3 px-4 h-40 bg-gray-50/50 dark:bg-gray-900/40 rounded-t-lg">
                  <div className="w-6 bg-primary/20 dark:bg-primary/30 rounded-t h-28 animate-pulse border-r border-t border-primary/10"></div>
                  <div className="w-8 bg-primary/30 dark:bg-primary/45 rounded-t h-32 animate-pulse border-r border-t border-primary/10"></div>
                  <div className="w-7 bg-primary/20 dark:bg-primary/25 rounded-t h-24 animate-pulse border-r border-t border-primary/10"></div>
                  <div className="w-9 bg-primary/35 dark:bg-primary/45 rounded-t h-36 animate-pulse border-r border-t border-primary/10"></div>
                  <div className="w-5 bg-primary/25 dark:bg-primary/30 rounded-t h-26 animate-pulse border-r border-t border-primary/10"></div>
                  <div className="w-8 bg-primary/30 dark:bg-primary/40 rounded-t h-34 animate-pulse border-r border-t border-primary/10"></div>
                  <div className="w-6 bg-primary/20 dark:bg-primary/25 rounded-t h-20 animate-pulse border-r border-t border-primary/10"></div>
                  <div className="w-7 bg-primary/35 dark:bg-primary/45 rounded-t h-30 animate-pulse border-r border-t border-primary/10"></div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center mt-4">Detecting titles and layout structure...</p>
              </div>
            ) : (
              <div className="relative w-full">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded bookshelf" 
                  className="max-h-80 max-w-full mx-auto rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full"></div>
                </div>
              </div>
            )}
          </div>
          
          {!isUploading && !isProcessing && !uploadedImage && (
            <div className="text-center mb-8">
              <p className="text-gray-500 dark:text-gray-400">
                <span className="font-medium">Tip:</span> Try to capture clear, well-lit images of book covers and spines
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                Detected Books ({detectedBooks.length})
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Click any card to select or deselect
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {detectedBooks.map((book, index) => {
                const isSelected = selectedIndexes.includes(index);
                const cleanAuthor = cleanAuthors(book.author);
                
                return (
                  <div 
                    key={index}
                    onClick={() => toggleSelect(index)}
                    className={`border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm transition-all relative cursor-pointer select-none ${
                      isSelected
                        ? 'border-primary/50 dark:border-primary/80 ring-1 ring-primary/20'
                        : 'border-gray-200 dark:border-gray-800 opacity-60 bg-gray-50/50 dark:bg-gray-900/30'
                    }`}
                  >
                    {/* Checkbox overlay button */}
                    <div 
                      className={`absolute top-2 right-2 p-1 rounded-full border transition-all z-10 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </div>

                    <div className="p-4 flex pr-10">
                      {book.coverUrl ? (
                        <img 
                          src={book.coverUrl} 
                          alt={book.title}
                          className="w-16 h-24 object-cover rounded shadow-sm shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/80x120?text=No+Cover';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-24 bg-sage-50 dark:bg-sage-950/20 border border-sage-200/50 dark:border-sage-800/40 flex flex-col items-center justify-center rounded text-sage-600 dark:text-sage-400 shadow-inner shrink-0">
                          <BookOpen className="h-6 w-6 mb-1 opacity-80" />
                          <span className="text-[9px] uppercase tracking-wider font-semibold opacity-70">Spine</span>
                        </div>
                      )}
                      <div className="ml-3 flex-1 overflow-hidden">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">{book.title}</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-xs mt-1 truncate">{cleanAuthor}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {onGetRecommendations && (
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-100 dark:border-gray-700 pt-6">
                {onReset && (
                  <Button 
                    onClick={onReset}
                    variant="outline"
                    className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 w-full sm:w-auto"
                  >
                    Scan Another Photo
                  </Button>
                )}
                
                <div className="flex items-center gap-4 ml-auto w-full sm:w-auto justify-end">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {selectedIndexes.length} of {detectedBooks.length} books selected
                  </span>
                  
                  <Button 
                    onClick={() => {
                      if (isLoading) {
                        return;
                      }
                      onGetRecommendations(detectedBooks.filter((_, i) => selectedIndexes.includes(i)));
                    }} 
                    disabled={selectedIndexes.length === 0}
                    className={`bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5 ${
                      isLoading ? 'cursor-wait opacity-90' : ''
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <LoaderPinwheel className="mr-2 h-4 w-4 animate-spin text-white" />
                        Getting recommendations...
                      </>
                    ) : (
                      'Get Recommendations'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
