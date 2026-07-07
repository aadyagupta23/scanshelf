import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import StarRating from "@/components/ui/star-rating";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Download, ExternalLink, Loader2, Sparkles, BookCheck } from "lucide-react";

interface SimilarBook {
  title: string;
  author: string;
  coverUrl?: string;
  rating?: string;
  summary?: string;
}

interface BookDetailModalProps {
  book: {
    title: string;
    author: string;
    coverUrl: string;
    rating: string;
    summary: string;
    matchScore?: number;
    matchReason?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  isSaving: boolean;
  onToggleSave: () => void;
}

export default function BookDetailModal({
  book,
  isOpen,
  onClose,
  isSaved,
  isSaving,
  onToggleSave,
}: BookDetailModalProps) {
  const { toast } = useToast();
  
  // State to support navigating inside similar books in the modal
  const [activeBook, setActiveBook] = useState<any>(null);
  const [similarBooks, setSimilarBooks] = useState<SimilarBook[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [loadingBookDetails, setLoadingBookDetails] = useState(false);

  // Sync active book when the main book prop changes
  useEffect(() => {
    if (book) {
      setActiveBook(book);
    }
  }, [book, isOpen]);

  // Fetch similar books whenever the active book changes
  useEffect(() => {
    if (!activeBook || !isOpen) return;

    const fetchSimilar = async () => {
      setLoadingSimilar(true);
      try {
        const response = await fetch(
          `/api/books/similar?title=${encodeURIComponent(activeBook.title)}&author=${encodeURIComponent(activeBook.author)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch similar books");
        }
        const data = await response.json();
        setSimilarBooks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching similar books:", error);
        setSimilarBooks([]);
      } finally {
        setLoadingSimilar(false);
      }
    };

    fetchSimilar();
  }, [activeBook, isOpen]);

  // Load a new book when a similar book is clicked
  const handleSimilarBookClick = async (similar: SimilarBook) => {
    setLoadingBookDetails(true);
    try {
      const response = await fetch(
        `/api/book-details/${encodeURIComponent(similar.title)}/${encodeURIComponent(similar.author)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch book details");
      }
      const details = await response.json();
      
      // Preserve or synthesize match details for the similar book
      setActiveBook({
        title: details.title,
        author: details.author,
        coverUrl: details.coverUrl || "",
        rating: details.rating || "4.0",
        summary: details.summary || "No summary available.",
        matchScore: activeBook?.matchScore ? Math.max(40, activeBook.matchScore - 15) : undefined, // Slightly lower match score for discovery
        matchReason: `Suggested because you liked "${activeBook.title}" by ${activeBook.author}.`,
      });
      
      toast({
        title: "Loaded suggestion",
        description: `Now viewing details for "${details.title}".`,
      });
    } catch (e) {
      console.error("Error loading suggestion details:", e);
      toast({
        title: "Error loading book details",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingBookDetails(false);
    }
  };

  if (!activeBook) return null;

  // Formatting match reason in second person
  const formattedMatchReason = activeBook.matchReason
    ?.replace(/the user's/gi, "your")
    .replace(/user has/gi, "you have")
    .replace(/user likes/gi, "you like")
    .replace(/user enjoys/gi, "you enjoy")
    .replace(/user is/gi, "you are")
    .replace(/user will/gi, "you will")
    .replace(/user/gi, "you");

  const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(
    activeBook.title + " " + activeBook.author
  )}&tag=gratitudedriv-20`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-[92vw] overflow-y-auto max-h-[85vh] p-0 md:rounded-xl border border-gray-200 dark:border-gray-800 bg-background shadow-2xl">
        <DialogHeader className="p-6 pb-0 select-none hidden">
          <DialogTitle>{activeBook.title}</DialogTitle>
          <DialogDescription>by {activeBook.author}</DialogDescription>
        </DialogHeader>

        {loadingBookDetails ? (
          <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Fetching details from Gemini...</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">
            {/* Left Column: Cover & Quick Actions */}
            <div className="p-6 md:w-1/3 flex flex-col items-center md:items-stretch bg-gray-50/50 dark:bg-gray-900/10">
              <div className="relative w-40 h-60 md:w-full md:h-72 bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 flex items-center justify-center rounded-xl shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden">
                {activeBook.coverUrl ? (
                  <img
                    src={activeBook.coverUrl}
                    alt={activeBook.title}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src === activeBook.coverUrl) {
                        target.src = activeBook.coverUrl.replace("http://", "https://");
                      }
                    }}
                  />
                ) : (
                  <BookOpen className="h-12 w-12 text-primary/40" />
                )}
                <div className="absolute inset-0 rounded-xl shadow-inner pointer-events-none" />
              </div>

              {/* Rating Section */}
              <div className="mt-4 flex flex-col items-center w-full">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Gemini Rating: {activeBook.rating ? parseFloat(activeBook.rating).toFixed(1) : "N/A"}
                </span>
                <div className="mt-1">
                  <StarRating rating={activeBook.rating || "0"} starSize={4} />
                </div>

                {activeBook.matchScore !== undefined && activeBook.matchScore >= 40 && (
                  <span
                    className={`mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      activeBook.matchScore >= 90
                        ? "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300"
                        : activeBook.matchScore >= 76
                        ? "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300"
                        : "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300"
                    }`}
                  >
                    {activeBook.matchScore}% Preference Match
                  </span>
                )}
              </div>

              {/* Button Actions */}
              <div className="mt-6 space-y-2.5 w-full">
                <Button
                  onClick={onToggleSave}
                  disabled={isSaving}
                  className={`w-full flex items-center justify-center gap-2 shadow-sm font-medium ${
                    isSaved
                      ? "bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                      : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/80"
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BookCheck className="h-4 w-4" />
                  )}
                  {isSaved ? "Saved to List" : "Save for Later"}
                </Button>

                <a
                  href={amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-amber-400 hover:bg-amber-500 text-black py-2.5 px-4 rounded-md text-sm font-semibold w-full text-center flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.99]"
                >
                  Buy on Amazon
                  <ExternalLink className="h-3.5 w-3.5 stroke-[2.5]" />
                </a>
              </div>
            </div>

            {/* Right Column: Book Details & Similar Recommendations */}
            <div className="p-6 md:w-2/3 flex flex-col space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                  {activeBook.title}
                </h2>
                <p className="text-md text-gray-500 dark:text-gray-400 mt-1">by {activeBook.author}</p>
              </div>

              {/* Matching Explanation Card */}
              {formattedMatchReason && formattedMatchReason.trim() !== "" && formattedMatchReason !== "using fallback algo" && (
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 p-4 rounded-xl border border-primary/20 dark:border-primary/80">
                  <div className="flex items-center gap-1.5 text-primary mb-1.5">
                    <Sparkles className="h-4 w-4 fill-primary/10 text-primary" />
                    <h4 className="text-sm font-bold">Why This Matches You</h4>
                  </div>
                  <p className="text-sm text-primary dark:text-primary-foreground/90 leading-relaxed">
                    {formattedMatchReason}
                  </p>
                </div>
              )}

              {/* Synopsis Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Synopsis</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {activeBook.summary}
                </p>
              </div>

              {/* On-Demand Similar Books Section */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Similar Books You Might Enjoy</h4>
                
                {loadingSimilar ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : similarBooks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {similarBooks.map((sim, i) => (
                      <div
                        key={i}
                        onClick={() => handleSimilarBookClick(sim)}
                        className="group relative cursor-pointer flex flex-col p-3 rounded-lg border border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-900/20 hover:border-primary/30 hover:bg-primary/5 transition-all"
                      >
                        <h5 className="font-semibold text-xs text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-primary transition-colors">
                          {sim.title}
                        </h5>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {sim.author}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500">No suggestions available.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
