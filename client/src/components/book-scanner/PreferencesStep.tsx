import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface PreferencesStepProps {
  preferences: {
    genres: string[];
    authors: string[];
  };
  onSubmit: (preferences: {
    genres: string[];
    authors: string[];
  }) => void;
  isLoading: boolean;
}

const allGenres = [
  "Fiction", 
  "Non-Fiction", 
  "Business", 
  "Design", 
  "Self-Help", 
  "Science",
  "Mystery", 
  "Romance", 
  "Fantasy", 
  "Science Fiction",
  "Biography", 
  "History",
  "Young Adult",
  "Thriller",
  "Horror",
  "Poetry",
  "Classics",
  "Comics"
];

export default function PreferencesStep({ preferences, onSubmit, isLoading }: PreferencesStepProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>(preferences.genres || []);
  const [authors, setAuthors] = useState<string[]>(preferences.authors || []);
  const [newAuthor, setNewAuthor] = useState<string>('');

  useEffect(() => {
    setSelectedGenres(preferences.genres || []);
    setAuthors(preferences.authors || []);
  }, [preferences]);

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const addAuthor = () => {
    if (newAuthor.trim() && !authors.includes(newAuthor.trim())) {
      setAuthors([...authors, newAuthor.trim()]);
      setNewAuthor('');
    }
  };

  const removeAuthor = (author: string) => {
    setAuthors(authors.filter(a => a !== author));
  };

  const handleSubmit = () => {
    onSubmit({
      genres: selectedGenres,
      authors
    });
  };

  return (
    <div>
      <div className="mb-6">
        <Label className="text-base font-semibold text-gray-950 dark:text-gray-50 mb-3 block">
          Select Your Favorite Genres
        </Label>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Choose at least one genre to help tailor recommendations to your taste.
        </p>
        <div className="flex flex-wrap gap-2">
          {allGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => toggleGenre(genre)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                selectedGenres.includes(genre)
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/80"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <Label className="text-base font-semibold text-gray-950 dark:text-gray-50 mb-3 block">
          Favorite Authors
        </Label>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Add specific authors whose writing styles you love.
        </p>
        
        <div className="flex gap-2 max-w-md mb-4">
          <input
            type="text"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAuthor())}
            placeholder="e.g. Stephen King"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <Button 
            onClick={addAuthor}
            type="button"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
          >
            Add
          </Button>
        </div>

        {authors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {authors.map((author) => (
              <div 
                key={author}
                className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 text-sm text-gray-800 dark:text-gray-200"
              >
                <span>{author}</span>
                <button
                  onClick={() => removeAuthor(author)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="h-3 w-3"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || selectedGenres.length === 0}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}