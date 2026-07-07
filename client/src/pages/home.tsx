import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-6xl mx-auto">
      <div className="mb-12 max-w-4xl mx-auto text-center py-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
          AI Bookshelf Scanner & Discovery
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          Take a photo of any bookshelf at bookstores, libraries, or home. Our AI identifies each book and matches them directly to your personal reading preferences.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/books">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-6 flex items-center gap-2 text-base shadow-sm">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-5 w-5"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Start Scanning Books
            </Button>
          </Link>
        </div>
      </div>

      <div className="my-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="text-primary font-extrabold text-3xl mb-2">98%</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Scan Accuracy</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Direct Gemini 2.5 Flash Vision OCR bypass reads rotated, tilted, and low-contrast spines correctly.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="text-primary font-extrabold text-3xl mb-2">100%</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Metadata Sync</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Instantly aggregates descriptions, ratings, categories, and reviews from Google Books & Open Library.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="text-primary font-extrabold text-3xl mb-2">0 ms</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Autofill Cache</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Loads preference presets and your saved reading list instantly from local storage cache.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <div className="flex items-center mb-3">
              <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 h-8 w-8 rounded-full flex items-center justify-center mr-3">
                <span className="font-semibold">1</span>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white">Upload Photo</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Take a photo of an entire bookshelf and our AI will identify each book.</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <div className="flex items-center mb-3">
              <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 h-8 w-8 rounded-full flex items-center justify-center mr-3">
                <span className="font-semibold">2</span>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white">Set Preferences</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Tell us about your reading interests and preferences to improve recommendations.</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <div className="flex items-center mb-3">
              <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 h-8 w-8 rounded-full flex items-center justify-center mr-3">
                <span className="font-semibold">3</span>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white">Find Matching Books</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Discover which books best match your taste with our AI-powered recommendations.</p>
          </div>
        </div>
      </div>

      <div className="mt-16 text-center">
        <div className="inline-flex justify-center items-center bg-primary/10 dark:bg-primary/20 text-primary h-12 w-12 rounded-full mb-4">
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
            className="h-6 w-6"
          >
            <path d="M12 3v12"></path>
            <path d="m8 11 4 4 4-4"></path>
            <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Start Using Scanshelf Today</h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-6">
          Never miss a great book again. Our app helps you quickly find books that match your unique reading preferences even in a crowded bookshelf.
        </p>
        <Link href="/books" onClick={() => window.scrollTo(0, 0)}>
          <Button>
            Get Started Now
          </Button>
        </Link>
      </div>
      
      {/* Footer with Privacy Policy and Terms */}
      <div className="mt-20 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-center items-center text-xs text-gray-500 dark:text-gray-400 space-y-2 md:space-y-0 md:space-x-6">
          <span>© {new Date().getFullYear()} Scanshelf. All rights reserved.</span>
          <Link href="/privacy-policy">
            <span className="hover:text-primary transition-colors">Privacy Policy</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
