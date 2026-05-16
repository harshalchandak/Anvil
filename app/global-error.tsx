"use client";

// Minimal client-side error handler. No framer-motion, no third-party deps —
// so static generation never trips. Required for app router.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: "4rem 1rem", fontFamily: "system-ui", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 500 }}>Something went wrong.</h1>
          <p style={{ marginTop: "0.5rem", color: "#6b7280" }}>{error.message || "Unknown error"}</p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              background: "#6e56f8",
              color: "#fff",
              border: 0,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
