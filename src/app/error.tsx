"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    
     console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-gray-500 max-w-md break-words">{error.message}</p>
      <button
        onClick={() => reset()}
        className="rounded bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-500"
      >
        Try again
      </button>
    </div>
  );
}
