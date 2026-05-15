"use client";

import { Suspense } from "react";
import { Header } from "@/components/header";
import { KeywordGap } from "@/components/keyword-gap";

function GapContent() {
  return (
    <>
      <Header />
      <main>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Keyword Gap Analyzer</h1>
            <p className="text-sm text-muted-foreground">
              Compare keyword portfolios between any two apps
            </p>
          </div>
          <KeywordGap />
        </div>
      </main>
    </>
  );
}

export default function GapPage() {
  return (
    <Suspense fallback={null}>
      <GapContent />
    </Suspense>
  );
}
