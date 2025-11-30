import { useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/react";
import Fuse from "fuse.js";

import { JsonItem } from "./types";
import { flattenJSON } from "./utils/helpers";
import { getSortedObject, ObjectSortType, sortPrimitiveResults } from "./utils/sortUtils";

import { Notification } from "./components/Notification";
import { Header } from "./components/Header";
import { Search } from "./components/Search";
import { ObjectResults } from "./components/ObjectResults";
import { PrimitiveResults } from "./components/PrimitiveResults";

export default function App() {
  const [jsonData, setJsonData] = useState<JsonItem[]>(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem("picklesData");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JsonItem[]>([]);
  const [sortedResults, setSortedResults] = useState<JsonItem[]>([]);
  const [suggestions, setSuggestions] = useState<JsonItem[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [prediction, setPrediction] = useState("");
  const [notification, setNotification] = useState("");
  const [fileLoaded, setFileLoaded] = useState(() => {
    // Initialize fileLoaded based on whether we have stored data
    return localStorage.getItem("picklesData") !== null;
  });
  const [fileName, setFileName] = useState<string>(() => {
    return localStorage.getItem("picklesFileName") || "";
  });
  const [resultsSort, setResultsSort] = useState<{ column: 'path' | 'value'; direction: 'asc' | 'desc' } | null>(null);
  const [objectSort, setObjectSort] = useState<ObjectSortType>('insertion');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("picklesDarkMode") === "true";
  });
  const fuseRef = useRef<Fuse<JsonItem> | null>(null);

  // Add effect to save to localStorage when jsonData changes
  useEffect(() => {
    if (jsonData.length > 0) {
      localStorage.setItem("picklesData", JSON.stringify(jsonData));
    } else {
      localStorage.removeItem("picklesData");
      localStorage.removeItem("picklesFileName");
    }
  }, [jsonData]);

  // Add effect to save filename
  useEffect(() => {
    if (fileName) {
      localStorage.setItem("picklesFileName", fileName);
    }
  }, [fileName]);

  // Add effect to save dark mode preference
  useEffect(() => {
    localStorage.setItem("picklesDarkMode", String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Add effect to initialize Fuse when loading from storage
  useEffect(() => {
    if (jsonData.length > 0) {
      fuseRef.current = new Fuse(jsonData, {
        keys: ["path", "value"],
        threshold: 0.3,
        includeScore: true,
        ignoreLocation: true,
      });
    }
  }, []); // Run once on mount

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setFileLoaded(false);
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (!file) return;

    // Save the filename
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (!event.target) return;
        const result = event.target.result;
        if (typeof result !== "string") return;
        const parsed = JSON.parse(result);
        const flattened = flattenJSON(parsed);
        setJsonData(flattened);
        setFileLoaded(true);
        fuseRef.current = new Fuse(flattened, {
          keys: ["path", "value"],
          threshold: 0.3,
          includeScore: true,
          ignoreLocation: true,
        });
      } catch (err) {
        setError("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (!query || !fuseRef.current) {
      setResults([]);
      setSuggestions([]);
      setPrediction("");
      return;
    }

    // Fuzzy word-based matching for suggestions (Path OR Value)
    // Split query into words and check if all words appear in the path or value
    const normalizedQuery = query.toLowerCase().replace(/\./g, ' ');
    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);

    const sugg = jsonData.filter((item) => {
      const normalizedPath = item.path.toLowerCase().replace(/\./g, ' ');
      const normalizedValue = String(item.value).toLowerCase();

      // Check if all query words are found in either path or value
      return queryWords.every(word =>
        normalizedPath.includes(word) || normalizedValue.includes(word)
      );
    });

    // Default sort: shortest path first
    sugg.sort((a, b) => a.path.length - b.path.length);

    setSuggestions(sugg);

    // If there's an active suggestion, only show that result (and its children if it's an object)
    if (activeSuggestion >= 0 && sugg[activeSuggestion]) {
      const selected = sugg[activeSuggestion];
      let matches = [selected];

      if (typeof selected.value === 'object') {
        const children = jsonData.filter(item =>
          item.path.startsWith(selected.path + '.')
        );
        matches = [...matches, ...children];
      }

      setResults(matches);
    } else {
      // First check for exact value matches
      const exactValueMatches = jsonData.filter(
        (item) => String(item.value).toLowerCase() === query.toLowerCase()
      );

      if (exactValueMatches.length > 0) {
        // If we have exact value matches, only show those
        setResults(exactValueMatches);
      } else {
        // Use fuzzy word-based search (Path OR Value)
        // Split query into words and check if all appear in path or value
        const normalizedQuery = query.toLowerCase().replace(/\./g, ' ');
        const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);

        let matches = jsonData.filter((item) => {
          const normalizedPath = item.path.toLowerCase().replace(/\./g, ' ');
          const normalizedValue = String(item.value).toLowerCase();

          // Check if all query words are found in either path or value
          return queryWords.every(word =>
            normalizedPath.includes(word) || normalizedValue.includes(word)
          );
        });

        // If any match is an object, find and include its children
        const objectMatches = matches.filter(m => typeof m.value === 'object');
        if (objectMatches.length > 0) {
          const children = jsonData.filter(item =>
            objectMatches.some(obj =>
              item.path.startsWith(obj.path + '.') && item.path !== obj.path
            )
          );

          // Add children that aren't already in matches
          const existingPaths = new Set(matches.map(m => m.path));
          children.forEach(child => {
            if (!existingPaths.has(child.path)) {
              matches.push(child);
            }
          });
        }

        setResults(matches);
      }
    }

    if (sugg.length > 0) {
      setPrediction(sugg[0].path.substring(query.length));
    } else {
      setPrediction("");
    }
  }, [query, jsonData, activeSuggestion]);

  // Sort results based on user preference
  useEffect(() => {
    setSortedResults(sortPrimitiveResults(results, resultsSort));
  }, [results, resultsSort]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
      setTimeout(() => {
        document
          .querySelector(`li[data-index="${activeSuggestion + 1}"]`)
          ?.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
      }, 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : -1));
      setTimeout(() => {
        document
          .querySelector(`li[data-index="${activeSuggestion - 1}"]`)
          ?.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
      }, 0);
    } else if (e.key === "Enter" && activeSuggestion >= 0) {
      selectSuggestion(suggestions[activeSuggestion]);
    } else if (e.key === "ArrowRight" && prediction) {
      setQuery((prev) => prev + prediction);
      e.preventDefault();
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setActiveSuggestion(-1);
    }
  };

  const selectSuggestion = (suggestion: JsonItem) => {
    setQuery(suggestion.path);
    navigator.clipboard.writeText(String(suggestion.path));
    setNotification(`Picked! ${suggestion.path}`);
    setTimeout(() => setNotification(""), 2000);
  };

  // Handle sort column click
  const handleSort = (column: 'path' | 'value') => {
    setResultsSort(prev => {
      if (prev?.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { column, direction: 'asc' };
    });
  };

  // Add a function to clear the stored data
  const clearStoredData = () => {
    setJsonData([]);
    setFileLoaded(false);
    setFileName("");
    setQuery("");
    setResults([]);
    setSuggestions([]);
    setActiveSuggestion(-1);
    setPrediction("");
    fuseRef.current = null;
  };

  return (
    <main className="mx-auto p-4 grid grid-cols-[20rem_3fr] gap-10 relative dark:bg-gray-900 min-h-screen transition-colors">
      <Notification message={notification} />

      <section className="bg-green-50/50 dark:bg-gray-800 py-8 px-4 rounded-lg transition-colors">
        <Header
          fileLoaded={fileLoaded}
          fileName={fileName}
          error={error}
          onFileUpload={handleFileUpload}
          onClearData={clearStoredData}
        />

        {fileLoaded && (
          <Search
            query={query}
            setQuery={setQuery}
            setActiveSuggestion={setActiveSuggestion}
            handleKeyDown={handleKeyDown}
            suggestions={suggestions}
            activeSuggestion={activeSuggestion}
            selectSuggestion={selectSuggestion}
          />
        )}
      </section>

      <section className="text-lg">
        <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <h2 className="text-xl font-bold dark:text-white">Results</h2>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ObjectResults
            sortedResults={sortedResults}
            objectSort={objectSort}
            setObjectSort={setObjectSort}
            getSortedObject={(obj) => getSortedObject(obj, objectSort)}
          />
          <PrimitiveResults
            sortedResults={sortedResults}
            resultsSort={resultsSort}
            handleSort={handleSort}
            selectSuggestion={selectSuggestion}
          />
        </div>
      </section>
      <Analytics />
    </main>
  );
}
