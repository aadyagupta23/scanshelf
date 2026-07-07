import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useDevice } from "@/contexts/DeviceContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Bell, Download, Check, Settings, Loader2 } from "lucide-react";

interface NotificationPrefs {
  emailMatches: boolean;
  weeklyDigest: boolean;
  pushAlerts: boolean;
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { deviceId, isLoading: deviceLoading } = useDevice();
  const { toast } = useToast();

  const [isExporting, setIsExporting] = useState(false);
  const [notifications, setNotifications] = useState<NotificationPrefs>(() => {
    try {
      const saved = localStorage.getItem("scanshelf_notification_preferences");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse notification preferences", e);
    }
    return {
      emailMatches: true,
      weeklyDigest: false,
      pushAlerts: true
    };
  });

  // Persist notification preferences in local storage on change
  const handleToggle = (key: keyof NotificationPrefs) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem("scanshelf_notification_preferences", JSON.stringify(updated));
      return updated;
    });
  };

  // Perform data export
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Fetch reading list
      const readingListResponse = await fetch("/api/saved-books", {
        credentials: "include",
        headers: {
          "Accept": "application/json"
        }
      });
      
      let readingList = [];
      if (readingListResponse.ok) {
        readingList = await readingListResponse.json();
      } else {
        console.warn("Failed to retrieve reading list from server, exporting empty list");
      }

      // Retrieve local scan history
      let scanHistory = [];
      try {
        const localHistory = localStorage.getItem("scanshelf_scan_history");
        if (localHistory) {
          scanHistory = JSON.parse(localHistory);
        }
      } catch (e) {
        console.error("Failed to read scan history", e);
      }

      // Construct backup payload
      const payload = {
        exportVersion: "1.0",
        exportDate: new Date().toISOString(),
        deviceId: deviceId || "unknown",
        appTheme: theme,
        preferences: {
          notifications,
          scanshelfPreferences: (() => {
            try {
              const prefs = localStorage.getItem("scanshelf_preferences");
              return prefs ? JSON.parse(prefs) : null;
            } catch {
              return null;
            }
          })()
        },
        readingList,
        scanHistory
      };

      // Delay slightly for premium micro-animation loading effect
      await new Promise(resolve => setTimeout(resolve, 800));

      // Trigger client-side download
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `scanshelf_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast({
        title: "Export complete",
        description: "Your reading list and scan history have been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export failed",
        description: "An error occurred while compiling your data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 dark:bg-primary/25 rounded-lg text-primary">
          <Settings className="h-6 w-6 animate-pulse" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Manage your interface appearance, preferences, and personal reading data.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Theme Preference Option Card */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-gray-900 dark:text-white">
              Theme Customization
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Select your preferred appearance for the bookshelf scanner and dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Light Mode Selector Card */}
              <div
                onClick={() => theme === "dark" && toggleTheme()}
                className={`relative overflow-hidden cursor-pointer rounded-xl border p-5 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm ${
                  theme === "light"
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary/20"
                    : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 hover:border-gray-300 dark:hover:border-gray-700"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                    <Sun className="h-5 w-5" />
                  </div>
                  {theme === "light" && (
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="font-semibold text-gray-950 dark:text-gray-100 mb-1">Light Theme</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Clean cream-colored backgrounds designed for brightly lit rooms and libraries.
                </p>
                {/* Visual Accent representation */}
                <div className="mt-4 flex gap-1.5">
                  <div className="h-4 w-4 rounded-full bg-primary" title="Primary Accent" />
                  <div className="h-4 w-12 rounded bg-gray-100 border border-gray-200" title="Cream Canvas" />
                </div>
              </div>

              {/* Dark Mode Selector Card */}
              <div
                onClick={() => theme === "light" && toggleTheme()}
                className={`relative overflow-hidden cursor-pointer rounded-xl border p-5 transition-all duration-200 hover:scale-[1.01] hover:shadow-sm ${
                  theme === "dark"
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary/20"
                    : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 hover:border-gray-300 dark:hover:border-gray-700"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg">
                    <Moon className="h-5 w-5" />
                  </div>
                  {theme === "dark" && (
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="font-semibold text-gray-950 dark:text-gray-100 mb-1">Dark Theme</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Subdued dark sage backgrounds minimizing screen glare in cozy reading spaces.
                </p>
                {/* Visual Accent representation */}
                <div className="mt-4 flex gap-1.5">
                  <div className="h-4 w-4 rounded-full bg-primary" title="Primary Accent" />
                  <div className="h-4 w-12 rounded bg-zinc-950 border border-zinc-800" title="Dark Canvas" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences Card */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-gray-900 dark:text-white">
              <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              Notifications & Updates
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Control when and how you receive bookshelf matches, newsletters, and reminders.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            {/* Email Matches Toggle */}
            <div className="flex items-start justify-between py-4 first:pt-0">
              <div className="space-y-1 pr-4">
                <label htmlFor="emailMatches" className="text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                  Email me about new matches
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receive recommendations matching your target genres when you scan new bookshelves.
                </p>
              </div>
              <Switch
                id="emailMatches"
                checked={notifications.emailMatches}
                onCheckedChange={() => handleToggle("emailMatches")}
                aria-label="Toggle email notifications for book matches"
              />
            </div>

            {/* Weekly Reading Digest Toggle */}
            <div className="flex items-start justify-between py-4">
              <div className="space-y-1 pr-4">
                <label htmlFor="weeklyDigest" className="text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                  Weekly reading digest
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  A neat weekly newsletter showcasing your latest bookshelf additions and trending recommendations.
                </p>
              </div>
              <Switch
                id="weeklyDigest"
                checked={notifications.weeklyDigest}
                onCheckedChange={() => handleToggle("weeklyDigest")}
                aria-label="Toggle weekly digest email"
              />
            </div>

            {/* Push Alerts Toggle */}
            <div className="flex items-start justify-between py-4 last:pb-0">
              <div className="space-y-1 pr-4">
                <label htmlFor="pushAlerts" className="text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                  Push alerts on scan success
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Show visual notifications directly in-app once your bookshelf image analysis finishes processing.
                </p>
              </div>
              <Switch
                id="pushAlerts"
                checked={notifications.pushAlerts}
                onCheckedChange={() => handleToggle("pushAlerts")}
                aria-label="Toggle push alerts for scanned shelves"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management & Export Card */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-gray-900 dark:text-white">
              Data Management
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Download your offline database backup containing your scan logs and reading list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/20 p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex gap-3">
                <div className="mt-0.5 p-1 bg-primary/10 dark:bg-primary/20 rounded text-primary">
                  <Download className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Export Information</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    This file format includes: your local preferences settings, notification flags, active reading list
                    entries retrieved from the cloud, and up to 50 items stored in your local scan history.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {deviceLoading ? (
                  <span>Loading device context...</span>
                ) : (
                  <span>Device Signature: <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono text-gray-600 dark:text-gray-300">{deviceId || "N/A"}</code></span>
                )}
              </div>
              <Button
                disabled={isExporting}
                onClick={handleExportData}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm cursor-pointer self-end"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Compiling Data...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download My Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
