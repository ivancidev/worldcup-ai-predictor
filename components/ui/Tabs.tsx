"use client";

import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

interface TabsContextType {
  active: string;
  setActive: (value: string) => void;
}

const TabsContext = createContext<TabsContextType>({
  active: "",
  setActive: () => {},
});

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
  onChange?: (value: string) => void;
}

export function Tabs({ defaultValue, children, className, onChange }: TabsProps) {
  const [active, setActive] = useState(defaultValue);

  const handleChange = (value: string) => {
    setActive(value);
    onChange?.(value);
  };

  return (
    <TabsContext.Provider value={{ active, setActive: handleChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        "flex p-1 rounded-xl bg-[#0e1220] border border-[#1e2640]",
        className
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { active, setActive } = useContext(TabsContext);
  const isActive = active === value;

  return (
    <button
      onClick={() => setActive(value)}
      className={cn(
        "flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
        isActive
          ? "bg-[#f5c518] text-[#080b14] shadow-sm"
          : "text-[#8899bb] hover:text-[#e8eaf0] hover:bg-[#1e2640]",
        "cursor-pointer",
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { active } = useContext(TabsContext);
  if (active !== value) return null;

  return <div className={cn("mt-4", className)}>{children}</div>;
}
