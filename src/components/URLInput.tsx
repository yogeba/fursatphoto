"use client";

import { useState } from "react";

interface URLInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  enableDescription: boolean;
  onToggleDescription: () => void;
}

export default function URLInput({ onSubmit, isLoading, enableDescription, onToggleDescription }: URLInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  const handleExampleClick = () => {
    const exampleUrl =
      "https://www.google.com/maps/place/Smoky+Falls+Mae+Fi+Resort/@25.2404059,91.676938,17z/data=!3m1!4b1!4m9!3m8!1s0x3750f3ca18e465ed:0xf9c7963c2e9e9904!5m2!4m1!1i2!8m2!3d25.2404059!4d91.676938!16s%2Fg%2F11fkzhqwl3?entry=ttu&g_ep=EgoyMDI1MTAyNi4wIKXMDSoASAFQAw%3D%3D";
    setUrl(exampleUrl);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="maps-url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Google Maps URL
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                AI Description
              </span>
              <button
                type="button"
                onClick={onToggleDescription}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  enableDescription
                    ? "bg-blue-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                role="switch"
                aria-checked={enableDescription}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${
                    enableDescription ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="font-medium mb-1">📋 How to get the full URL:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>🔍 Go to Google Maps and search for a place</li>
              <li>📤 Click the &quot;Share&quot; button on the place</li>
              <li>📋 Click &quot;Copy link&quot; - this gives you a short URL</li>
              <li>🌐 Paste the short URL in your browser and press Enter</li>
              <li>
                📝 Copy the full URL from the address bar (it will be much longer)
              </li>
            </ol>
            <p className="mt-2 text-xs">
              <strong>💡 Example:</strong> The full URL should look like this:
              <br />
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                https://www.google.com/maps/place/Place+Name/@coordinates,17z/data=!3m1!4b1!4m9!3m8!1s...
              </code>
            </p>
            <button
              type="button"
              onClick={handleExampleClick}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
            >
              🏨 Try this example: Smoky Falls Mae Fi Resort
            </button>
          </div>
          <div className="relative">
            <input
              id="maps-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="🔗 Paste your Google Maps place URL here..."
              className="w-full px-4 py-3 text-base border border-gray-200 dark:border-gray-700 rounded-2xl glass-effect focus-ring transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              <div className="w-5 h-5 text-gray-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!url.trim() || isLoading}
          className="w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-2xl transition-all duration-200 card-hover button-press disabled:transform-none shadow-lg hover:shadow-xl disabled:shadow-none"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </div>
            ) : (
              "📸 Extract Photos"
            )}
        </button>
      </form>
    </div>
  );
}
