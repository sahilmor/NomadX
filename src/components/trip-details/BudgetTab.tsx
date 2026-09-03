// src/components/trip-details/BudgetTab.tsx

import { useEffect, useMemo, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { ShoppingBag, Receipt } from "lucide-react";
import { useTripExpenses } from "@/services/expense.service";
import {
  useTripTransport,
  type TransportOption,
  type CityStopInfo,
} from "@/services/stays-transport.service";
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
      <div className="flex justify-end space-x-1 sm:space-x-2">
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
      const updates: TablesUpdate<"ItineraryItem"> = {
        cost: formData.cost,
        notes: formData.notes || null,
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
      <DialogContent className="sm:max-w-[480px] w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {mode === "create" ? "Add Expense" : "Edit Expense"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-2">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

          <DialogFooter className="gap-2 sm:gap-3">
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
  cityStops: CityStopInfo[];
  isLoadingItinerary: boolean;
}

// One canonical category model shared by the summary cards and the log badges.
type Category = "Stay" | "Food" | "Transport" | "Activities" | "Shopping" | "Other";

const categoryMeta: Record<Category, { icon: typeof Home; color: string; badgeClass: string }> = {
  Stay: { icon: Home, color: "text-primary", badgeClass: "bg-primary/10 text-primary" },
  Food: { icon: Utensils, color: "text-coral", badgeClass: "bg-coral/10 text-coral" },
  Transport: { icon: Car, color: "text-mustard", badgeClass: "bg-mustard/10 text-mustard" },
  Activities: { icon: Ticket, color: "text-success", badgeClass: "bg-success/10 text-success" },
  Shopping: { icon: ShoppingBag, color: "text-purple-500", badgeClass: "bg-purple-500/10 text-purple-500" },
  Other: { icon: Receipt, color: "text-muted-foreground", badgeClass: "bg-muted text-muted-foreground" },
};

const normalizeCategory = (raw: string): Category => {
  switch (raw) {
    case "STAY": return "Stay";
    case "FOOD": return "Food";
    case "TRANSPORT": case "MOVE": return "Transport";
    case "SIGHT": case "ACTIVITY": case "ENTERTAINMENT": return "Activities";
    case "SHOPPING": return "Shopping";
    default: return "Other";
  }
};

const BudgetTab: React.FC<BudgetTabProps> = ({
  tripId,
  trip,
  itinerary,
  cityStops,
  isLoadingItinerary,
}) => {
  const { data: expenseRows, isLoading: isLoadingExpenses } = useTripExpenses(tripId);
  const { data: transportOptions } = useTripTransport(tripId);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ItineraryItem | null>(
    null
  );

  // Nights available per city — used to multiply per-day local transport costs.
  const cityNightsByName = useMemo(() => {
    const map: Record<string, number> = {};
    cityStops.forEach((cs) => {
      try {
        map[cs.name.toLowerCase()] = Math.max(1, differenceInDays(new Date(cs.departure), new Date(cs.arrival)));
      } catch {
        map[cs.name.toLowerCase()] = 1;
      }
    });
    return map;
  }, [cityStops]);

  const optionById = useMemo(() => {
    const m = new Map<string, TransportOption>();
    (transportOptions || []).forEach((o) => m.set(o.id, o));
    return m;
  }, [transportOptions]);

  const budgetData = useMemo(() => {
    type UnifiedExpense = {
      key: string;
      date: Date | null;
      title: string;
      category: Category;
      amount: number;
      source: "pick" | "manual";
      raw: ItineraryItem | null;
    };

    const items: UnifiedExpense[] = [];

    // 1) Exact picks from the Expense table (stays + transport the user chose).
    //    Stay amounts are already costPerNight x nights. LOCAL transport picks
    //    are per-day, so they are multiplied by the nights in that city.
    for (const e of expenseRows || []) {
      let amount = e.amount || 0;
      let title = (e.notes || e.category).replace(/^Stay pick \S+ \u2014 /, "").replace(/^Transport pick \S+ \u2014 /, "");

      const pickMatch = (e.notes || "").match(/^Transport pick (\S+)/);
      if (pickMatch) {
        const opt = optionById.get(pickMatch[1]);
        if (opt && opt.scope === "LOCAL") {
          const nights = cityNightsByName[(opt.fromCity || "").toLowerCase()];
          if (nights && nights > 1 && opt.cost != null) {
            amount = opt.cost * nights;
            title = `${title} \u00d7 ${nights} days`;
          }
        }
      }

      items.push({
        key: `exp-${e.id}`,
        date: e.createdAt ? new Date(e.createdAt) : null,
        title,
        category: normalizeCategory(e.category),
        amount,
        source: "pick",
        raw: null,
      });
    }

    // 2) Plan estimates from the itinerary — but ONLY food and activities.
    //    Stay and Move costs come from the user's picks instead, so they are
    //    excluded here to avoid double counting.
    for (const item of itinerary || []) {
      if (!item.cost || item.cost <= 0) continue;
      if (item.kind === "STAY" || item.kind === "MOVE") continue;
      items.push({
        key: `itin-${item.id}`,
        date: item.day ? new Date(item.day) : null,
        title: item.title,
        category: normalizeCategory(item.kind),
        amount: item.cost,
        source: "manual",
        raw: item,
      });
    }

    const totals: Record<Category, number> = {
      Stay: 0, Food: 0, Transport: 0, Activities: 0, Shopping: 0, Other: 0,
    };
    let totalSpent = 0;
    for (const it of items) {
      totals[it.category] += it.amount;
      totalSpent += it.amount;
    }

    items.sort(
      (a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0)
    );

    const totalBudget = trip?.budgetCap || 0;
    return {
      items,
      totals,
      totalSpent,
      budgetRemaining: totalBudget - totalSpent,
      budgetProgress: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    };
  }, [expenseRows, itinerary, trip, cityNightsByName, optionById]);

  if (isLoadingItinerary || isLoadingExpenses) {
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
    <div className="space-y-6 sm:space-y-8">
      {/* Budget Overview */}
      <Card className="border-0 bg-card">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Budget Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-5">
          <div className="space-y-1">
            <div className="flex justify-between text-muted-foreground text-xs sm:text-sm">
              <span>Spent</span>
              <span>
                {budgetData.totalSpent.toFixed(2)} /{" "}
                {trip.budgetCap?.toFixed(2)} {trip.currency}
              </span>
            </div>
            <Progress value={budgetData.budgetProgress} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-lg bg-muted p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Budget</p>
              <p className="text-xl sm:text-2xl font-bold">
                {trip.budgetCap?.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg p-3 sm:p-4 bg-muted">
              <p className="text-xs sm:text-sm text-muted-foreground">Remaining</p>
              <p
                className={`text-xl sm:text-2xl font-bold ${
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
          <CardTitle className="text-lg sm:text-xl">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {(["Stay", "Food", "Transport", "Activities", "Shopping", "Other"] as Category[])
            .filter(
              (c) =>
                budgetData.totals[c] > 0 ||
                ["Stay", "Food", "Transport", "Activities"].includes(c)
            )
            .map((c) => {
              const Icon = categoryMeta[c].icon;
              return (
                <div
                  key={c}
                  className="flex items-center space-x-3 rounded-lg bg-muted p-3 sm:p-4"
                >
                  <div className="rounded-full bg-background p-2">
                    <Icon className={`w-5 h-5 ${categoryMeta[c].color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">{c}</p>
                    <p className="font-bold text-sm sm:text-base truncate">
                      {budgetData.totals[c].toFixed(2)} {trip.currency}
                    </p>
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>

            <Card className="border-0 bg-card">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg sm:text-xl">Expense Log</CardTitle>
          <Button
            size="sm"
            className="btn-coral self-start sm:self-auto"
            onClick={handleOpenCreateExpense}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </CardHeader>
        <CardContent>
          {budgetData.items.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm">Item</TableHead>
                    <TableHead className="text-xs sm:text-sm">Category</TableHead>
                    <TableHead className="text-right w-32 text-xs sm:text-sm">
                      Cost
                    </TableHead>
                    <TableHead className="w-20 text-right text-xs sm:text-sm">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetData.items.map((item) => (
                    <TableRow key={item.key}>
                      <TableCell className="text-xs sm:text-sm">
                        {item.date ? format(item.date, "MMM d") : "—"}
                      </TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm">
                        {item.title}
                        {item.source === "pick" && (
                          <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                            picked · exact
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <Badge
                          variant="outline"
                          className={categoryMeta[item.category].badgeClass}
                        >
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs sm:text-sm">
                        {item.amount.toFixed(2)} {trip.currency}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.source === "manual" && item.raw ? (
                          <ExpenseRowActions
                            expense={item.raw}
                            tripId={tripId}
                            onEdit={handleEditExpense}
                          />
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            manage in Stays / Transport
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center text-sm sm:text-base">
              No expenses yet — pick stays and transport, or add one manually.
            </p>
          )}
        </CardContent>
      </Card>

      
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