import { useState, KeyboardEvent } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const PRESET_SERVICES = [
  "hvac contractor",
  "closet design",
  "plumbing",
  "electrical",
  "roofing",
  "painting",
  "flooring",
  "kitchen remodel",
  "bathroom remodel",
  "landscaping",
];

interface ServiceMultiSelectProps {
  value: string[];
  onChange: (services: string[]) => void;
  disabled?: boolean;
}

export function ServiceMultiSelect({ value, onChange, disabled }: ServiceMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const handleToggleService = (service: string) => {
    const newValue = value.includes(service)
      ? value.filter((s) => s !== service)
      : [...value, service];
    onChange(newValue);
  };

  const handleAddCustomService = () => {
    const trimmed = customInput.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setCustomInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomService();
    }
  };

  const handleRemoveService = (service: string) => {
    onChange(value.filter((s) => s !== service));
  };

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {value.length === 0 ? "Select services..." : `${value.length} service${value.length > 1 ? 's' : ''} selected`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search services..." />
            <CommandList>
              <CommandEmpty>No services found.</CommandEmpty>
              <CommandGroup>
                {PRESET_SERVICES.map((service) => (
                  <CommandItem
                    key={service}
                    value={service}
                    onSelect={() => handleToggleService(service)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(service) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {service}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Custom service input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add custom service..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={handleAddCustomService}
          disabled={!customInput.trim() || disabled}
        >
          Add
        </Button>
      </div>

      {/* Selected services as chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((service) => (
            <Badge
              key={service}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {service}
              <button
                type="button"
                onClick={() => handleRemoveService(service)}
                disabled={disabled}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
