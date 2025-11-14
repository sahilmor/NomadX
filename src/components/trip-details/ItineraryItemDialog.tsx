import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useCreateItineraryItem, useUpdateItineraryItem } from "@/services/itinerary.service";

type ItineraryItem = Tables<"ItineraryItem">;
type FormMode = "create" | "edit";

interface ItineraryItemDialogProps {
  tripId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: ItineraryItem | null;
}

const itemKinds = ["SIGHT", "FOOD", "ACTIVITY", "MOVE", "STAY", "REST"];

type FormState = {
  title: string;
  day: string;         // yyyy-MM-dd (for <input type="date" />)
  kind: string;
  startTime: string;
  notes: string;
  cost: number | "";   // allow empty string for controlled input
};

export const ItineraryItemDialog: React.FC<ItineraryItemDialogProps> = ({
  tripId,
  isOpen,
  onOpenChange,
  editingItem,
}) => {
  const { toast } = useToast();
  const mode: FormMode = editingItem ? "edit" : "create";

  const [formData, setFormData] = useState<FormState>({
    title: "",
    day: "",
    kind: itemKinds[0],
    startTime: "",
    notes: "",
    cost: "",
  });

  const createMutation = useCreateItineraryItem(tripId);
  const updateMutation = useUpdateItineraryItem(tripId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Helper to convert DB date/time to input format if needed
  const normalizeDateForInput = (value?: string | null): string => {
    if (!value) return "";
    // If it's ISO (e.g. "2025-11-14T00:00:00Z"), take first 10 chars
    return value.length > 10 ? value.slice(0, 10) : value;
  };

  // Sync form state whenever dialog opens or editingItem changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingItem) {
      setFormData({
        title: editingItem.title || "",
        day: normalizeDateForInput(editingItem.day as unknown as string),
        kind: editingItem.kind || itemKinds[0],
        startTime: (editingItem.startTime as string) || "",
        notes: editingItem.notes || "",
        cost: editingItem.cost ?? "",
      });
    } else {
      // New item
      setFormData({
        title: "",
        day: "",
        kind: itemKinds[0],
        startTime: "",
        notes: "",
        cost: "",
      });
    }
  }, [editingItem, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "cost") {
      // Allow empty string in the input for better UX
      if (value === "") {
        setFormData((prev) => ({ ...prev, cost: "" }));
      } else {
        setFormData((prev) => ({
          ...prev,
          cost: isNaN(Number(value)) ? prev.cost : Number(value),
        }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    if (isPending) return; // optional: prevent closing while saving
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.day) {
      toast({
        title: "Validation Error",
        description: "Title and Date are required.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      title: formData.title.trim(),
      day: formData.day, // "yyyy-MM-dd" string is fine for date column
      kind: formData.kind,
      startTime: formData.startTime || null,
      notes: formData.notes || null,
      cost: formData.cost === "" || formData.cost <= 0 ? null : formData.cost,
      tripId: tripId,
    };

    if (mode === "create") {
      createMutation.mutate(payload as TablesInsert<"ItineraryItem">, {
        onSuccess: () => {
          toast({
            title: "Item Added",
            description: `${formData.title} has been added to the itinerary.`,
          });
          onOpenChange(false);
        },
        onError: (e) => {
          toast({
            title: "Error",
            description: `Failed to add item: ${e.message}`,
            variant: "destructive",
          });
        },
      });
    } else {
      updateMutation.mutate(
        {
          id: editingItem!.id,
          updates: payload as TablesUpdate<"ItineraryItem">,
        },
        {
          onSuccess: () => {
            toast({
              title: "Item Updated",
              description: `${formData.title} has been updated.`,
            });
            onOpenChange(false);
          },
          onError: (e) => {
            toast({
              title: "Error",
              description: `Failed to update item: ${e.message}`,
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Itinerary Item" : "Edit Item"}
          </DialogTitle>
          <CardDescription>
            Adjust the details for this activity.
          </CardDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Activity Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={isPending}
              />
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="day">Date</Label>
                <Input
                  id="day"
                  name="day"
                  type="date"
                  value={formData.day}
                  onChange={handleChange}
                  required
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Time (Optional)</Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange}
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Category + Cost */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kind">Category</Label>
                <select
                  id="kind"
                  name="kind"
                  value={formData.kind}
                  onChange={handleChange}
                  disabled={isPending}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {itemKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind.charAt(0).toUpperCase() +
                        kind.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  value={formData.cost}
                  onChange={handleChange}
                  placeholder="0.00"
                  min={0}
                  step="0.01"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Booking info, tips, etc."
                disabled={isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="btn-hero" disabled={isPending}>
              {isPending
                ? "Saving..."
                : mode === "create"
                ? "Add Item"
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};