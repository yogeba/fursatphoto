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
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="maps-url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Google Maps URL
              <button type="button" onClick={() => setShowHelp(!showHelp)}
                className="ml-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showHelp ? "hide help" : "?"}
              </button>
            </label>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${enableDescription ? "text-blue-500" : "text-gray-400 dark:text-gray-500"}`}>
                AI Description {enableDescription ? "on" : "off"}
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

          {showHelp && (
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              Open the place on Google Maps in your browser, then copy the full URL from the address bar. It should contain <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/place/</code> and <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">@coordinates</code>.
            </div>
          )}

          <div className="relative">
            <input
              id="maps-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste full Google Maps URL from browser address bar..."
              className="w-full px-4 py-3 text-base border border-gray-200 dark:border-gray-700 rounded-2xl glass-effect focus-ring transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              <div className="w-5 h-5 text-gray-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            "Extract Photos"
          )}
        </button>
      </form>
    </div>
  );
}
