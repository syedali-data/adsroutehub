import { useMemo } from "react";
import { TimeRange } from "@/components/dashboard/TimeRangeFilter";

export const useDateRange = (range: TimeRange) => {
  return useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    let endDate = now;
    
    switch (range) {
      case "today":
        startDate = today;
        break;
      case "7days":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30days":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90days":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "all":
        startDate = new Date(2020, 0, 1);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
    }
    
    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = new Date(startDate.getTime());
    
    return {
      startDate,
      endDate,
      previousStartDate,
      previousEndDate,
    };
  }, [range]);
};
