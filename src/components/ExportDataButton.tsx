import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ExportDataButton() {
  const { toast } = useToast();

  const handleExport = () => {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        version: 1,
        meals: JSON.parse(localStorage.getItem("mealplanner_meals") || "[]"),
        plan: JSON.parse(localStorage.getItem("mealplanner_plan") || "[]"),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      a.href = url;
      a.download = `mealplanner-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Exported!",
        description: `${data.meals.length} meals & ${data.plan.length} planned items saved`,
      });
    } catch (err) {
      console.error("Export failed:", err);
      toast({
        title: "Export failed",
        description: "Could not export data",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="rounded-xl gap-1.5"
      onClick={handleExport}
    >
      <Download className="h-4 w-4" />
      Export
    </Button>
  );
}
