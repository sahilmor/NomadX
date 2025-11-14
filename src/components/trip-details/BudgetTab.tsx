// src/components/trip-details/BudgetTab.tsx

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Home,
  Utensils,
  Car,
  Ticket,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateItineraryItem,
  useUpdateItineraryItem,
} from "@/services/itinerary.service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ItineraryItem = Tables<"ItineraryItem">;
type TripWithOwner = Tables<"Trip"> & { Owner?: any }; // or import your exact type

// -------------------- ROW ACTIONS (EDIT + DELETE) --------------------

interface ExpenseRowActionsProps {
  expense: ItineraryItem;
  tripId: string;
  onEdit: (expense: ItineraryItem) => void;
}

const ExpenseRowActions: React.FC<ExpenseRowActionsProps> = ({
  expense,
  tripId,
  onEdit,
}) => {
  const { toast } = useToast();
  const updateItineraryMutation = useUpdateItineraryItem(tripId);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = () => {
    updateItineraryMutation.mutate(
      {
        id: expense.id,
        updates: { cost: null }, // only clear cost so it disappears from expense log
      },
      {
        onSuccess: () => {
          toast({
            title: "Expense Deleted",
            description: "The expense has been removed from the log.",
          });
          setIsConfirmOpen(false);
        },
        onError: (e: any) => {
          toast({
            title: "Error",
            description: `Failed to delete expense: ${e.message}`,
            variant: "destructive",
          });
        },
      }
    );
  };

  const pending = updateItineraryMutation.isPending;

  return (
    <>
      <div className="flex justify-end space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(expense)}
          disabled={pending}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsConfirmOpen(true)}
          disabled={pending}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this cost from your budget calculations, but will
              keep the original itinerary item. You can always add the expense
              again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// -------------------- DIALOG FOR ADD / EDIT EXPENSE --------------------

type FormMode = "create" | "edit";

const itemKinds = ["STAY", "FOOD", "MOVE", "SIGHT", "ACTIVITY", "REST"];

interface ExpenseDialogProps {
  tripId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingExpense: ItineraryItem | null;
}

type ExpenseFormState = {
  title: string;
  day: string;
  kind: string;
  cost: number | "";
  notes: string;
};

const ExpenseDialog: React.FC<ExpenseDialogProps> = ({
  tripId,
  isOpen,
  onOpenChange,
  editingExpense,
}) => {
  const { toast } = useToast();
  const mode: FormMode = editingExpense ? "edit" : "create";

  const [formData, setFormData] = useState<ExpenseFormState>({
    title: "",
    day: "",
    kind: itemKinds[0],
    cost: "",
    notes: "",
  });

  const createMutation = useCreateItineraryItem(tripId);
  const updateMutation = useUpdateItineraryItem(tripId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const normalizeDateForInput = (value?: string | null): string => {
    if (!value) return "";
    return value.length > 10 ? value.slice(0, 10) : value;
  };

  useEffect(() => {
    if (!isOpen) return;

    if (editingExpense) {
      // populate with existing data but we will NOT change title/day/kind in edit mode
      setFormData({
        title: editingExpense.title || "",
        day: normalizeDateForInput(editingExpense.day as unknown as string),
        kind: editingExpense.kind || itemKinds[0],
        cost: editingExpense.cost ?? "",
        notes: editingExpense.notes || "",
      });
    } else {
      setFormData({
        title: "",
        day: "",
        kind: itemKinds[0],
        cost: "",
        notes: "",
      });
    }
  }, [editingExpense, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "cost") {
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

  const handleClose = (open: boolean) => {
    if (!open && !isPending) {
      onOpenChange(false);
    } else {
      onOpenChange(open);
    }
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

    if (formData.cost === "" || formData.cost <= 0) {
      toast({
        title: "Validation Error",
        description: "Cost must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "create") {
      // NEW EXPENSE: create a new ItineraryItem with cost
      const payload = {
        tripId,
        title: formData.title.trim(),
        day: formData.day, // yyyy-MM-dd
        kind: formData.kind as ItineraryItem["kind"],
        cost: formData.cost,
        notes: formData.notes || null,
        startTime: null,
        endTime: null,
        poiId: null,
      };

      createMutation.mutate(payload as TablesInsert<"ItineraryItem">, {
        onSuccess: () => {
          toast({
            title: "Expense Added",
            description: `${formData.title} has been added.`,
          });
          onOpenChange(false);
        },
        onError: (e: any) => {
          toast({
            title: "Error",
            description: `Failed to add expense: ${e.message}`,
            variant: "destructive",
          });
        },
      });
    } else {
      // EDIT EXISTING EXPENSE: ONLY update cost and notes
      const updates: TablesUpdate<"ItineraryItem"> = {
        cost: formData.cost,
        notes: formData.notes || null,
        // DO NOT touch title/day/kind/startTime/endTime/poiId/tripId here
      };

      updateMutation.mutate(
        {
          id: editingExpense!.id,
          updates,
        },
        {
          onSuccess: () => {
            toast({
              title: "Expense Updated",
              description: `${formData.title} has been updated.`,
            });
            onOpenChange(false);
          },
          onError: (e: any) => {
            toast({
              title: "Error",
              description: `Failed to update expense: ${e.message}`,
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const readOnlyMeta = mode === "edit";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Expense" : "Edit Expense"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="expense-title">Title</Label>
              <Input
                id="expense-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={isPending || readOnlyMeta}
                required
              />
            </div>

            {/* Date + Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-day">Date</Label>
                <Input
                  id="expense-day"
                  name="day"
                  type="date"
                  value={formData.day}
                  onChange={handleChange}
                  disabled={isPending || readOnlyMeta}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-kind">Category</Label>
                <select
                  id="expense-kind"
                  name="kind"
                  value={formData.kind}
                  onChange={handleChange}
                  disabled={isPending || readOnlyMeta}
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
            </div>

            {/* Cost */}
            <div className="space-y-2">
              <Label htmlFor="expense-cost">Cost</Label>
              <Input
                id="expense-cost"
                name="cost"
                type="number"
                min={0}
                step="0.01"
                value={formData.cost}
                onChange={handleChange}
                disabled={isPending}
                placeholder="0.00"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="expense-notes">Notes</Label>
              <Textarea
                id="expense-notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={isPending}
                placeholder="Extra info, receipts, etc."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="btn-coral" disabled={isPending}>
              {isPending
                ? "Saving..."
                : mode === "create"
                ? "Add Expense"
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// -------------------- MAIN BUDGET TAB --------------------

interface BudgetTabProps {
  tripId: string;
  trip: TripWithOwner;
  itinerary: ItineraryItem[];
  isLoadingItinerary: boolean;
}

const BudgetTab: React.FC<BudgetTabProps> = ({
  tripId,
  trip,
  itinerary,
  isLoadingItinerary,
}) => {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ItineraryItem | null>(
    null
  );

  const budgetData = useMemo(() => {
    if (!itinerary || !trip) {
      return {
        totalSpent: 0,
        spentOnStay: 0,
        spentOnFood: 0,
        spentOnMove: 0,
        spentOnActivity: 0,
        expenseItems: [] as ItineraryItem[],
        budgetRemaining: trip?.budgetCap || 0,
        budgetProgress: 0,
      };
    }

    const expenseItems = itinerary.filter(
      (item) => item.cost && item.cost > 0
    );

    let totalSpent = 0;
    let spentOnStay = 0;
    let spentOnFood = 0;
    let spentOnMove = 0;
    let spentOnActivity = 0;

    for (const item of expenseItems) {
      const cost = item.cost || 0;
      totalSpent += cost;
      switch (item.kind) {
        case "STAY":
          spentOnStay += cost;
          break;
        case "FOOD":
          spentOnFood += cost;
          break;
        case "MOVE":
          spentOnMove += cost;
          break;
        case "SIGHT":
        case "ACTIVITY":
          spentOnActivity += cost;
          break;
        default:
          break;
      }
    }

    const totalBudget = trip.budgetCap || 0;
    const budgetRemaining = totalBudget - totalSpent;
    const budgetProgress =
      totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      totalSpent,
      spentOnStay,
      spentOnFood,
      spentOnMove,
      spentOnActivity,
      expenseItems,
      budgetRemaining,
      budgetProgress,
    };
  }, [itinerary, trip]);

  if (isLoadingItinerary) {
    return <LoadingSpinner text="Loading budget..." />;
  }

  const handleOpenCreateExpense = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (item: ItineraryItem) => {
    setEditingExpense(item);
    setIsExpenseModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card className="border-0 bg-card">
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>Spent</span>
              <span>
                {budgetData.totalSpent.toFixed(2)} /{" "}
                {trip.budgetCap?.toFixed(2)} {trip.currency}
              </span>
            </div>
            <Progress value={budgetData.budgetProgress} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold">
                {trip.budgetCap?.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg p-4 bg-muted">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p
                className={`text-2xl font-bold ${
                  budgetData.budgetRemaining < 0
                    ? "text-destructive"
                    : "text-foreground"
                }`}
              >
                {budgetData.budgetRemaining.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By Category */}
      <Card className="border-0 bg-card">
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 rounded-lg bg-muted p-4">
            <div className="rounded-full bg-primary/10 p-2">
              <Home className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stay</p>
              <p className="font-bold">{budgetData.spentOnStay.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 rounded-lg bg-muted p-4">
            <div className="rounded-full bg-coral/10 p-2">
              <Utensils className="w-5 h-5 text-coral" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Food</p>
              <p className="font-bold">{budgetData.spentOnFood.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 rounded-lg bg-muted p-4">
            <div className="rounded-full bg-mustard/10 p-2">
              <Car className="w-5 h-5 text-mustard" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transport</p>
              <p className="font-bold">{budgetData.spentOnMove.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 rounded-lg bg-muted p-4">
            <div className="rounded-full bg-success/10 p-2">
              <Ticket className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Activities</p>
              <p className="font-bold">
                {budgetData.spentOnActivity.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Log */}
      <Card className="border-0 bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Expense Log</CardTitle>
          <Button size="sm" className="btn-coral" onClick={handleOpenCreateExpense}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </CardHeader>
        <CardContent>
          {budgetData.expenseItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right w-32">Cost</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgetData.expenseItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {format(new Date(item.day), "MMM d")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.kind}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.cost?.toFixed(2)} {trip.currency}
                    </TableCell>
                    <TableCell>
                      <ExpenseRowActions
                        expense={item}
                        tripId={tripId}
                        onEdit={handleEditExpense}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center">
              No expenses logged in your itinerary yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Expense Modal */}
      <ExpenseDialog
        tripId={tripId}
        isOpen={isExpenseModalOpen}
        onOpenChange={(open) => {
          setIsExpenseModalOpen(open);
          if (!open) setEditingExpense(null);
        }}
        editingExpense={editingExpense}
      />
    </div>
  );
};

export default BudgetTab;