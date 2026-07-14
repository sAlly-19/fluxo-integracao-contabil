"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[] | string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ value, onValueChange, options, placeholder = "Selecione...", disabled = false, className, label }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleKeyDown);
      }

      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [isOpen]);

    const handleSelect = (option: string) => {
      onValueChange(option);
      setIsOpen(false);
    };

    return (
      <div className={cn("relative w-full", className)} ref={containerRef}>
        <div
          ref={ref}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "relative border rounded-xl bg-muted/20 px-3.5 pt-5 pb-2 focus-within:ring-2 cursor-pointer transition-all group flex items-center justify-between select-none h-14",
            isOpen ? "border-primary ring-2 ring-primary/15" : "border-border/80 focus-within:border-primary focus-within:ring-primary/15",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
        >
          <div className="flex flex-col text-left justify-center h-full">
            <span className="absolute left-3.5 top-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all group-hover:text-primary">
              {label}
            </span>
            <span className="text-sm font-semibold text-foreground mt-1 select-none pr-8">
              {value || placeholder}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200 ease-in-out select-none absolute right-3.5 top-1/2 -translate-y-1/2",
              isOpen && "transform rotate-180 text-primary"
            )}
          />
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 4, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{ originY: 0 }}
              className="absolute left-0 right-0 z-50 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-2xl"
            >
              <div className="max-h-60 overflow-y-auto space-y-0.5">
                {options.map((option) => {
                  const isSelected = option === value;
                  return (
                    <div
                      key={option}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground cursor-pointer transition-colors select-none",
                        isSelected
                          ? "bg-primary text-primary-foreground font-bold"
                          : "hover:bg-muted"
                      )}
                    >
                      <span>{option}</span>
                      {isSelected && <Check className="size-4" />}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Select.displayName = "Select";
