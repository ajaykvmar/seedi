// src/components/country-selector.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";

interface CountrySelectorProps {
  value: string;
  onChange: (code: string) => void;
}

export function CountrySelector({ value, onChange }: CountrySelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {COUNTRIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.flag} {c.storeName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
