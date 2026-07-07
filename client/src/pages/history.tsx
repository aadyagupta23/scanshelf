import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useDevice } from "@/contexts/DeviceContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, BookOpen, ChevronRight, History } from "lucide-react";

interface ScanSessionSummary {
  id: number;
  deviceId: string;
  createdAt: string;
  booksCount: number;
  firstBookCover: string;
  firstBookTitle: string;
  firstBookAuthor: string;
}

export default function HistoryPage() {
  const [, setLocation] = useLocation();
  const { deviceId, isLoading: deviceLoading } = useDevice();

  const { data: sessions, isLoading, error } = useQuery<ScanSessionSummary[]>({
    queryKey: ["/api/scan-sessions", deviceId],
    queryFn: async () => {
      if (!deviceId) return [];
      const response = await fetch(`/api/scan-sessions?deviceId=${deviceId}`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch scan sessions");
      }
      return response.json();
    },
    enabled: !deviceLoading && !!deviceId,
  });

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
      time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
    };
  };

  const handleSessionClick = (id: number) => {
    setLocation(`/books?sessionId=${id}`);
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 dark:bg-primary/25 rounded-lg text-primary">
          <History className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Scan History</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Review your past bookshelf scans and re-generate personalized recommendations.
          </p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {(isLoading || deviceLoading) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardContent className="p-5 flex gap-4">
                <Skeleton className="h-20 w-14 rounded-md shrink-0 bg-gray-200 dark:bg-gray-800" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-1/3 bg-gray-200 dark:bg-gray-800" />
                  <Skeleton className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800" />
                  <Skeleton className="h-5 w-1/4 bg-gray-200 dark:bg-gray-800" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <Card className="border-destructive bg-destructive/5 text-center p-8">
          <CardTitle className="text-destructive mb-2">Failed to load history</CardTitle>
          <CardDescription>
            There was an error connecting to the database. Please try reloading the page.
          </CardDescription>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !deviceLoading && !error && (!sessions || sessions.length === 0) && (
        <div className="text-center py-16 px-4 bg-gray-50/50 dark:bg-gray-900/10 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl max-w-xl mx-auto">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            <History className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-950 dark:text-gray-100 mb-2">No scans found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            You haven't scanned any bookshelves yet. Take a picture of a shelf to automatically extract book titles
            and receive tailored recommendations!
          </p>
          <Link href="/books">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 shadow-sm cursor-pointer">
              Start Scanning Books
            </Button>
          </Link>
        </div>
      )}

      {/* Scans Grid List */}
      {!isLoading && !deviceLoading && !error && sessions && sessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => {
            const timeInfo = formatDateTime(session.createdAt);
            return (
              <Card
                key={session.id}
                onClick={() => handleSessionClick(session.id)}
                className="group relative cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 dark:hover:border-primary/40"
              >
                <CardContent className="p-5 flex items-center gap-4">
                  {/* Book Spine / Cover Thumbnail */}
                  <div className="relative h-20 w-14 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200/50 dark:border-gray-800 shrink-0 flex items-center justify-center shadow-sm overflow-hidden group-hover:shadow-md transition-shadow">
                    {session.firstBookCover ? (
                      <img
                        src={session.firstBookCover}
                        alt="First book cover"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <BookOpen className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                    )}
                    
                    {/* Badge showing extra books count */}
                    {session.booksCount > 1 && (
                      <span className="absolute bottom-1 right-1 px-1 py-0.5 text-[10px] font-bold rounded bg-primary text-primary-foreground shadow-sm">
                        +{session.booksCount - 1}
                      </span>
                    )}
                  </div>

                  {/* Scan Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>{timeInfo.date}</span>
                      <span>•</span>
                      <span>{timeInfo.time}</span>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary transition-colors">
                      Bookshelf Scan #{session.id}
                    </h3>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                      {session.booksCount} book{session.booksCount === 1 ? "" : "s"} identified
                      {session.firstBookTitle && ` (incl. "${session.firstBookTitle}")`}
                    </p>
                  </div>

                  {/* Navigation Arrow */}
                  <div className="text-gray-300 dark:text-gray-700 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                    <ChevronRight className="h-5 w-5 stroke-[2.5]" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
