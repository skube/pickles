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
  const [jsonData, setJsonData] = useState<JsonItem[]>([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JsonItem[]>([]);
  const [suggestions, setSuggestions] = useState<JsonItem[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [prediction, setPrediction] = useState("");
  const [notification, setNotification] = useState("");
  const fuseRef = useRef<Fuse<JsonItem> | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (!event.target) return;
        const result = event.target.result;
        if (typeof result !== "string") return;
        const parsed = JSON.parse(result);
        const flattened = flattenJSON(parsed);
        setJsonData(flattened);
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
    const fuseResults = fuseRef.current.search(query);
    const matches = fuseResults.map((r) => r.item);
    setResults(matches);

    const sugg = jsonData.filter((item) =>
      item.path.toLowerCase().includes(query.toLowerCase())
    );
    sugg.sort((a, b) => a.path.length - b.path.length);
    setSuggestions(sugg);
    if (sugg.length > 0) {
      setPrediction(sugg[0].path.substring(query.length));
    } else {
      setPrediction("");
    }
    setActiveSuggestion(-1);
  }, [query, jsonData]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : -1));
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

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-[1fr_2fr] gap-10 relative ">
      {notification && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-10 bg-green-500 text-white  text-2xl rounded shadow-lg transition-opacity duration-1000 animate-fadeOut border-4 border-green-700">
          {notification}
        </div>
      )}
      <div className="bg-green-50/50 p-10 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">🥒 pickles</h1>
        <p className="text-sm text-gray-500 mb-4">
          The perfect picker for parsing perplexing JSON properties.
        </p>
        <div className="mb-4">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="w-full p-2 border rounded"
          />
          {error && <div className="mt-2 text-red-500">{error}</div>}
        </div>

        <div className="relative mb-4">
          <input
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
                  className={`p-2 cursor-pointer flex justify-between ${
                    activeSuggestion === index ? "bg-blue-100" : ""
                  }`}
                  onMouseDown={() => selectSuggestion(item)}
                >
                  <span>{item.path}</span>
                  {typeof item.value === "string" &&
                    HEX_REGEX.test(item.value) && (
                      <span
                        className="w-4 h-4 rounded-full inline-block mr-4"
                        style={{ backgroundColor: item.value }}
                      ></span>
                    )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Results</h2>
        {results.map((item) => (
          <div key={item.path} className="border-b py-2">
            <div>
              <strong>{item.path}</strong>:
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
                className="w-6 h-6 rounded-full border"
                style={{ backgroundColor: item.value }}
              ></div>
            )}
          </div>
        ))}
      </div>
      <Analytics />
    </div>
  );
}
