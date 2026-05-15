"use client";

import { Suspense } from "react";
import { Header } from "@/components/header";
import { FeatureTrends } from "@/components/feature-trends";

function FeaturesContent() {
  return (
    <>
      <Header />
      <main>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Feature Trends</h1>
            <p className="text-sm text-muted-foreground">
              See what features competitors are shipping — mined from release notes
            </p>
          </div>
          <FeatureTrends />
        </div>
      </main>
    </>
  );
}

export default function FeaturesPage() {
  return (
    <Suspense fallback={null}>
      <FeaturesContent />
    </Suspense>
  );
}
