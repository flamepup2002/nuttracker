import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MobileSelect({ 
  value, 
  onValueChange, 
  options, 
  placeholder = "Select...",
  title = "Select an option",
  className = "",
  triggerClassName = ""
}) {
  const [open, setOpen] = React.useState(false);

  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <>
      {/* Mobile Drawer */}
      <div className="md:hidden">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button 
              variant="outline" 
              className={`w-full justify-start ${triggerClassName}`}
            >
              {selectedLabel}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {options.map((option) => (
                <Button
                  key={option.value}
                  variant={value === option.value ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop Select */}
      <div className="hidden md:block">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className={className}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}