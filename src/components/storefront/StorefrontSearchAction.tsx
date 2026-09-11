"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatMinorUnitMoney } from "@/lib/money";

type SearchResult = {
  slug: string;
  name: string;
  audience: "WOMEN" | "MEN" | "UNISEX" | null;
  family: string | null;
  collection: string | null;
  price: { amount: number; currency: string; isFrom: boolean };
  thumbnail: { url: string; alt: string; kind: "IMAGE" | "VIDEO"; posterUrl?: string } | null;
  match: { kind: string; label: string };
};

type SearchResponse = {
  query: string;
  results: SearchResult[];
  error: { message: string; status: number } | null;
};

const SEARCH_MIN_LENGTH = 2;
const SEARCH_MAX_LENGTH = 80;

function formatPrice(price: SearchResult["price"]) {
  const amount = formatMinorUnitMoney(price);
  return `${price.isFrom ? "From " : ""}${amount}`;
}

function audienceLabel(audience: SearchResult["audience"]) {
  if (!audience) return null;
  return audience[0] + audience.slice(1).toLowerCase();
}

function focusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
}

export function StorefrontSearchAction() {
  const router = useRouter();
  const labelId = useId();
  const inputId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const searchCacheRef = useRef(new Map<string, SearchResponse>());
  const isNavigatingRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = () => {
    isNavigatingRef.current = false;
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const navigateTo = (url: string) => {
    isNavigatingRef.current = true;
    setIsOpen(false);
    setActiveIndex(-1);
    router.push(url);
  };

  const viewAllResults = () => {
    const trimmed = query.trim().slice(0, SEARCH_MAX_LENGTH);
    if (!trimmed || trimmed.length < SEARCH_MIN_LENGTH) return;
    isNavigatingRef.current = true;
    close();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  useEffect(() => {
    if (!isOpen) return;
    const trigger = triggerRef.current;
    const previousScrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      abortRef.current?.abort();
      if (!isNavigatingRef.current) {
        window.scrollTo(0, previousScrollY);
        trigger?.focus();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key !== "Tab") return;
      const elements = focusableElements(dialogRef.current);
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim().slice(0, SEARCH_MAX_LENGTH);
    abortRef.current?.abort();
    setActiveIndex(-1);
    if (!trimmed || trimmed.length < SEARCH_MIN_LENGTH) {
      setResults([]);
      setStatus("idle");
      setErrorMessage("");
      return;
    }

    const cached = searchCacheRef.current.get(trimmed.toLowerCase());
    if (cached) {
      setResults(cached.results);
      setStatus(cached.error ? "error" : cached.results.length ? "ready" : "empty");
      setErrorMessage(cached.error?.message ?? "");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const timer = window.setTimeout(async () => {
      try {
        setStatus("loading");
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const payload = (await response.json()) as SearchResponse;
        if (controller.signal.aborted) return;
        if (!response.ok || payload.error) {
          setResults([]);
          setStatus("error");
          setErrorMessage(payload.error?.message ?? "Search is unavailable right now.");
          return;
        }
        searchCacheRef.current.set(trimmed.toLowerCase(), payload);
        setResults(payload.results);
        setStatus(payload.results.length ? "ready" : "empty");
      } catch (error) {
        if (controller.signal.aborted) return;
        setResults([]);
        setStatus("error");
        setErrorMessage("Search is unavailable right now.");
      }
    }, 260);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, query]);

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        navigateTo(`/product/${results[activeIndex].slug}`);
        return;
      }
      const trimmed = query.trim().slice(0, SEARCH_MAX_LENGTH);
      if (trimmed.length >= SEARCH_MIN_LENGTH) {
        navigateTo(`/search?q=${encodeURIComponent(trimmed)}`);
        return;
      }
      inputRef.current?.focus();
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (results.length ? (current + 1) % results.length : -1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (results.length ? (current <= 0 ? results.length - 1 : current - 1) : -1));
    }
  };

  return (
    <>
      <button
        type="button"
        className="p-2 text-[#c2b8a3] hover:text-[#e5c982] transition-colors flex items-center justify-center cursor-pointer"
        aria-label="Search AURA"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => {
          isNavigatingRef.current = false;
          setIsOpen(true);
        }}
        ref={triggerRef}
      >
        <Search className="w-5 h-5" strokeWidth={1.5} />
      </button>

      {isOpen && mounted && createPortal(
        <div className="storefront-search-overlay" role="dialog" aria-modal="true" aria-labelledby={labelId} ref={dialogRef}>
          <button type="button" className="storefront-search-overlay__backdrop" aria-label="Close search" onClick={close} />
          <div className="storefront-search-overlay__panel">
            <div className="storefront-search-overlay__header">
              <p id={labelId}>Search AURA</p>
              <button type="button" className="storefront-search-overlay__close" onClick={close} aria-label="Close search">
                <X aria-hidden="true" />
              </button>
            </div>
            <form
              className="storefront-search-form"
              action="/search"
              onSubmit={(event) => {
                event.preventDefault();
                event.currentTarget.querySelector<HTMLInputElement>("input")?.focus();
              }}
            >
              <label htmlFor={inputId}>Search fragrances, notes or collections</label>
              <div className="storefront-search-input-wrap">
                <Search className="storefront-search-input-icon" aria-hidden="true" size={22} />
                <input
                  id={inputId}
                  ref={inputRef}
                  name="q"
                  value={query}
                  maxLength={SEARCH_MAX_LENGTH}
                  autoComplete="off"
                  placeholder="Rose, oud, musk, Élixir..."
                  onChange={(event) => setQuery(event.target.value.slice(0, SEARCH_MAX_LENGTH))}
                  onKeyDown={onInputKeyDown}
                  aria-controls="storefront-search-results"
                  aria-activedescendant={activeIndex >= 0 ? `storefront-search-result-${activeIndex}` : undefined}
                />
                {query.length > 0 && (
                  <button
                    type="button"
                    className="storefront-search-clear-btn"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    aria-label="Clear search input"
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="storefront-search-tags" aria-label="Suggested fragrance notes">
                <span className="storefront-search-tags__label">Suggested:</span>
                {["Rose", "Oud", "Amber", "Sandalwood", "Jasmine", "Vanilla"].map((note) => (
                  <button
                    key={note}
                    type="button"
                    className="storefront-search-tag"
                    onClick={() => {
                      setQuery(note);
                      inputRef.current?.focus();
                    }}
                  >
                    {note}
                  </button>
                ))}
              </div>
            </form>
            <div className="storefront-search-status" aria-live="polite">
              {status === "idle" && query.trim().length < SEARCH_MIN_LENGTH && "Type at least two characters to begin."}
              {status === "loading" && "Searching the Maison..."}
              {status === "empty" && "No published fragrances found."}
              {status === "error" && errorMessage}
            </div>
            <div id="storefront-search-results" className="storefront-search-results" role="listbox" aria-label="Search results">
              {results.map((result, index) => (
                <Link
                  id={`storefront-search-result-${index}`}
                  key={result.slug}
                  href={`/product/${result.slug}`}
                  className={`storefront-search-result${activeIndex === index ? " storefront-search-result--active" : ""}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={(event) => {
                    event.preventDefault();
                    navigateTo(`/product/${result.slug}`);
                  }}
                >
                  <span className="storefront-search-result__thumb">
                    {result.thumbnail ? (
                      <Image src={result.thumbnail.posterUrl ?? result.thumbnail.url} alt={result.thumbnail.alt} fill sizes="96px" unoptimized />
                    ) : (
                      <span aria-hidden="true">A</span>
                    )}
                  </span>
                  <span className="storefront-search-result__body">
                    <strong>{result.name}</strong>
                    <small>{[audienceLabel(result.audience), result.family, result.collection].filter(Boolean).join(" · ") || result.match.label}</small>
                  </span>
                  <span
                    className="storefront-search-result__price"
                    title={result.price.isFrom ? "Starting price across available sizes" : undefined}
                  >
                    {formatPrice(result.price)}
                  </span>
                </Link>
              ))}
            </div>
            {results.length > 0 && (
              <button type="button" className="storefront-search-view-all" onClick={viewAllResults}>
                View all results <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
