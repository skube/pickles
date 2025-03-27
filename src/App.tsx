import { useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/react";

import Fuse from "fuse.js";

interface JsonItem {
  path: string;
  value: any;
}

const flattenJSON = (data: any, parent = "") => {
  let result: { path: string; value: any }[] = [];
  if (typeof data === "object" && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      const path = parent ? `${parent}.${key}` : key;
      result.push({ path, value });
      result = result.concat(flattenJSON(value, path));
    });
  }
  return result;
};

const HEX_REGEX = /^#(?:[A-Fa-f0-9]{3}){1,2}$/;

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

    // Keep path-based suggestions flexible
    const sugg = jsonData.filter((item) =>
      item.path.toLowerCase().includes(query.toLowerCase())
    );
    sugg.sort((a, b) => a.path.length - b.path.length);
    setSuggestions(sugg);

    // If there's an active suggestion, only show that result
    if (activeSuggestion >= 0 && sugg[activeSuggestion]) {
      setResults([sugg[activeSuggestion]]);
    } else {
      // First check for exact value matches
      const exactValueMatches = jsonData.filter(
        (item) => String(item.value).toLowerCase() === query.toLowerCase()
      );

      if (exactValueMatches.length > 0) {
        // If we have exact value matches, only show those
        setResults(exactValueMatches);
      } else {
        // Fall back to fuzzy search using Fuse.js for path searching
        const fuseResults = fuseRef.current.search(query);
        const matches = fuseResults.map((r) => r.item);
        setResults(matches);
      }
    }

    if (sugg.length > 0) {
      setPrediction(sugg[0].path.substring(query.length));
    } else {
      setPrediction("");
    }
  }, [query, jsonData, activeSuggestion]);

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
    <main className="mx-auto p-4 grid grid-cols-[30rem_3fr] gap-10 relative ">
      {notification && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-10 bg-green-500 text-white  text-2xl rounded shadow-lg transition-opacity duration-1000 animate-fadeOut border-4 border-green-700">
          {notification}
        </div>
      )}
      <section className="bg-green-50/50 p-10 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">🥒 pickles</h1>
        <p className="text-sm text-gray-500 mb-4">
          The perfect picker for parsing perplexing JSON properties.
        </p>
        <div className="mb-4">
          <div className="flex gap-2 mb-2">
            {!fileLoaded && (
              <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="w-full p-2 border rounded border-gray-300"
              />
            )}
          </div>
          {fileName && (
            <div className="text-sm text-gray-600 flex justify-between">
              <span>Loaded file: {fileName}</span>
              {fileLoaded && (
                <button
                  onClick={clearStoredData}
                  className="ml-2 px-4 py-1 bg-red-500 text-white-50 rounded hover:bg-red-600 hover:text-white"
                >
                  remove
                </button>
              )}
            </div>
          )}
          {error && <div className="mt-2 text-red-500">{error}</div>}
        </div>

        {fileLoaded && (
          <div className="relative mb-4">
            <input
              id="search"
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Search properties..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border rounded mt-1 max-h-60 overflow-auto">
                {suggestions.map((item, index) => (
                  <li
                    key={item.path}
                    data-index={index}
                    className={`p-2 cursor-pointer flex justify-between ${
                      activeSuggestion === index ? "bg-blue-100" : ""
                    }`}
                    onMouseDown={() => selectSuggestion(item)}
                  >
                    <div className="flex justify-end">
                      {typeof item.value === "string" &&
                        HEX_REGEX.test(item.value) && (
                          <span
                            className="w-4 h-4 rounded-full inline-block mr-4"
                            style={{ backgroundColor: item.value }}
                          ></span>
                        )}
                      {typeof item.value === "string" &&
                        item.value.length < 10 && (
                          <span className="w-4 h-4 rounded-full inline-block">
                            {item.value}
                          </span>
                        )}
                    </div>
                    <span className="text-sm inline-block mr-2">
                      {item.path}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="text-lg">
        <h2 className="text-xl font-bold mb-4">Results</h2>
        {results.map((item) => (
          <div key={item.path} className="border-b py-2">
            <div>
              <strong>{item.path}</strong>:{` `}
              {typeof item.value === "object" ? (
                <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded">
                  {JSON.stringify(item.value, null, 2)}
                </pre>
              ) : (
                <span>{String(item.value)}</span>
              )}
            </div>
            {typeof item.value === "string" && HEX_REGEX.test(item.value) && (
              <div
                className="w-10 h-10 border"
                style={{ backgroundColor: item.value }}
              ></div>
            )}
          </div>
        ))}
      </section>
      <Analytics />
    </main>
  );
}
