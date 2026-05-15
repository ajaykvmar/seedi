"use client";

import { Suspense } from "react";
import { Header } from "@/components/header";
import { CountryComparison } from "@/components/country-comparison";

function MultiCountryContent() {
  return (
    <>
      <Header />
      <main>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Multi-Country Analysis</h1>
            <p className="text-sm text-muted-foreground">
              Compare keyword opportunity across stores — free, no API key needed
            </p>
          </div>
          <CountryComparison />
        </div>
      </main>
    </>
  );
}

export default function MultiCountryPage() {
  return (
    <Suspense fallback={null}>
      <MultiCountryContent />
    </Suspense>
  );
}
