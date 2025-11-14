// src/components/trip-details/ItineraryTab.tsx

import { useState } from "react";
import { format } from "date-fns";
import { Clock, Pencil, Trash2, Plus } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useDeleteItineraryItem } from "@/services/itinerary.service";
import { ItineraryItemDialog } from "@/components/trip-details/ItineraryItemDialog";

type ItineraryItem = Tables<"ItineraryItem">;

interface ItineraryTabProps {
  tripId: string;
  itinerary: ItineraryItem[];
}

const ItineraryTab: React.FC<ItineraryTabProps> = ({ tripId, itinerary }) => {
  const { toast } = useToast();
  const deleteItineraryMutation = useDeleteItineraryItem(tripId);

  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);

  const handleOpenItineraryModal = (item: ItineraryItem | null = null) => {
    setEditingItem(item);
    setIsItineraryModalOpen(true);
  };

  const handleDeleteItineraryItem = (itemId: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the itinerary item: "${title}"?`
      )
    )
      return;

    deleteItineraryMutation.mutate(itemId, {
      onSuccess: () => {
        toast({
          title: "Item Deleted",
          description: "Itinerary item successfully removed.",
        });
      },
      onError: (e) => {
        toast({
          title: "Error",
          description: `Failed to delete item: ${e.message}`,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <>
      <Card className="border-0 bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Trip Itinerary</CardTitle>
            <CardDescription>
              Your day-by-day plan. (AI-Generated)
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="btn-hero"
            onClick={() => handleOpenItineraryModal()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {itinerary && itinerary.length > 0 ? (
            itinerary.map((item, index) => (
              <div key={item.id} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  {index < itinerary.length - 1 && (
                    <div className="w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="pb-6 w-full flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(item.day), "EEEE, MMM d")}
                    </p>
                    <h4 className="font-semibold text-lg text-foreground">
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground">{item.notes}</p>
                    <Badge variant="outline" className="mt-2">
                      {item.kind}
                    </Badge>
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenItineraryModal(item)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleDeleteItineraryItem(item.id, item.title)
                      }
                      disabled={deleteItineraryMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center">
              No itinerary items found for this trip.
            </p>
          )}
        </CardContent>
      </Card>

      <ItineraryItemDialog
        tripId={tripId}
        isOpen={isItineraryModalOpen}
        onOpenChange={(open) => {
          setIsItineraryModalOpen(open);
          if (!open) setEditingItem(null);
        }}
        editingItem={editingItem}
      />
    </>
  );
};

export default ItineraryTab;