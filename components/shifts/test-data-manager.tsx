"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Database, Trash2, AlertCircle } from "lucide-react";
import { addDays, format } from "date-fns";

interface TestDataManagerProps {
  drivers: Array<{ id: string; first_name: string; last_name: string }>;
  onDataCreated: () => void;
}

export function TestDataManager({ drivers, onDataCreated }: TestDataManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const createTestTasks = async () => {
    if (drivers.length === 0) {
      setMessage({ type: "error", text: "No drivers found. Please add drivers first." });
      return;
    }

    setIsCreating(true);
    setMessage(null);

    try {
      const today = new Date();
      const testTasks = [];

      // Get 3 drivers for testing
      const testDrivers = drivers.slice(0, Math.min(3, drivers.length));

      // Create various test tasks for each driver with different dates to avoid conflicts
      for (let i = 0; i < testDrivers.length; i++) {
        const driver = testDrivers[i];
        const baseDate = addDays(today, i * 7); // Each driver gets tasks on different weeks
        
        // Task 1: Charter service
        testTasks.push({
          task_number: 1,
          task_type: "charter",
          driver_id: driver.id,
          start_date: format(baseDate, "yyyy-MM-dd"),
          end_date: format(baseDate, "yyyy-MM-dd"),
          start_time: "08:00",
          end_time: "12:00",
          hours_per_day: 4,
          title: "Airport Transfer - VIP Client",
          description: "Premium charter service to Narita Airport",
          location: "Tokyo Station, Tokyo, Japan",
          customer_name: "Tanaka Corporation",
          customer_phone: "+81-90-1234-5678",
        });

        // Task 2: Regular service next day
        testTasks.push({
          task_number: 1,
          task_type: "regular",
          driver_id: driver.id,
          start_date: format(addDays(baseDate, 1), "yyyy-MM-dd"),
          end_date: format(addDays(baseDate, 1), "yyyy-MM-dd"),
          start_time: "09:00",
          end_time: "17:00",
          hours_per_day: 8,
          title: "Daily City Tour",
          description: "Regular city tour service",
          location: "Shibuya, Tokyo, Japan",
          customer_name: "Tourism Agency",
          customer_phone: "+81-90-2345-6789",
        });

        // Task 3: Training (multi-day)
        testTasks.push({
          task_number: 1,
          task_type: "training",
          driver_id: driver.id,
          start_date: format(addDays(baseDate, 2), "yyyy-MM-dd"),
          end_date: format(addDays(baseDate, 4), "yyyy-MM-dd"),
          start_time: "10:00",
          end_time: "16:00",
          hours_per_day: 6,
          title: "Safety Training Course",
          description: "3-day mandatory safety and customer service training",
          location: "Training Center, Shinagawa, Tokyo",
        });

        // Task 4: Evening service (different day)
        testTasks.push({
          task_number: 2,
          task_type: "regular",
          driver_id: driver.id,
          start_date: format(addDays(baseDate, 5), "yyyy-MM-dd"),
          end_date: format(addDays(baseDate, 5), "yyyy-MM-dd"),
          start_time: "18:00",
          end_time: "22:00",
          hours_per_day: 4,
          title: "Evening Service",
          description: "Evening pickup service",
          location: "Roppongi, Tokyo, Japan",
        });

        // Task 5: Maintenance
        testTasks.push({
          task_number: 1,
          task_type: "maintenance",
          driver_id: driver.id,
          start_date: format(addDays(baseDate, 6), "yyyy-MM-dd"),
          end_date: format(addDays(baseDate, 6), "yyyy-MM-dd"),
          start_time: "08:00",
          end_time: "10:00",
          hours_per_day: 2,
          title: "Vehicle Inspection",
          description: "Scheduled vehicle maintenance and inspection",
          location: "Service Center, Yokohama",
        });

        // Task 6: Meeting
        testTasks.push({
          task_number: 2,
          task_type: "meeting",
          driver_id: driver.id,
          start_date: format(addDays(baseDate, 7), "yyyy-MM-dd"),
          end_date: format(addDays(baseDate, 7), "yyyy-MM-dd"),
          start_time: "14:00",
          end_time: "16:00",
          hours_per_day: 2,
          title: "Team Briefing",
          description: "Monthly team meeting and updates",
          location: "Main Office, Shinjuku",
        });
      }

      // Add some unassigned tasks (tasks without driver_id or with a fake one)
      const unassignedTasks = [
        {
          task_number: 1,
          task_type: "charter",
          driver_id: drivers[0].id, // We'll delete this after to make it "unassigned" conceptually
          start_date: format(addDays(today, 7), "yyyy-MM-dd"),
          end_date: format(addDays(today, 7), "yyyy-MM-dd"),
          start_time: "06:00",
          end_time: "10:00",
          hours_per_day: 4,
          title: "Early Morning Airport Run",
          description: "Needs driver assignment",
          location: "Haneda Airport, Tokyo",
          customer_name: "Business Traveler",
        },
        {
          task_number: 1,
          task_type: "regular",
          driver_id: drivers[0].id,
          start_date: format(addDays(today, 8), "yyyy-MM-dd"),
          end_date: format(addDays(today, 10), "yyyy-MM-dd"),
          start_time: "09:00",
          end_time: "18:00",
          hours_per_day: 9,
          title: "3-Day Conference Transport",
          description: "Multi-day conference shuttle service",
          location: "Convention Center, Makuhari",
        },
      ];

      testTasks.push(...unassignedTasks);

      // Create tasks one by one to avoid conflicts
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];
      
      console.log(`🚀 Starting to create ${testTasks.length} test tasks...`);
      
      for (const task of testTasks) {
        try {
          console.log(`Creating task: ${task.title} (${task.task_type}) for driver ${task.driver_id}`);
          
          const response = await fetch("/api/crew-tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(task),
          });
          
          if (response.ok) {
            successCount++;
            console.log(`✅ Successfully created: ${task.title}`);
          } else {
            failCount++;
            const errorText = await response.text();
            const errorMsg = `❌ Failed to create "${task.title}": ${errorText}`;
            console.log(errorMsg);
            errors.push(errorMsg);
          }
        } catch (err) {
          failCount++;
          const errorMsg = `❌ Error creating "${task.title}": ${err}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      console.log(`\n📊 Test Task Creation Summary:`);
      console.log(`✅ Successfully created: ${successCount}`);
      console.log(`❌ Failed: ${failCount}`);
      if (errors.length > 0) {
        console.log(`\n❌ Detailed errors:`);
        errors.forEach(error => console.log(`  ${error}`));
      }
      
      if (successCount === 0 && failCount > 0) {
        throw new Error(`All tasks failed to create (${failCount}). They may already exist.`);
      }

      setMessage({
        type: "success",
        text: `Created ${successCount} new tasks (${failCount} skipped/already exist)`,
      });
      
      onDataCreated();
    } catch (error: any) {
      console.error("Error creating test tasks:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to create test tasks",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const clearAllTasks = async () => {
    if (!confirm("Are you sure you want to delete ALL tasks? This cannot be undone.")) {
      return;
    }

    setIsClearing(true);
    setMessage(null);

    try {
      // Fetch tasks directly from the database
      const params = new URLSearchParams({
        start_date: "2020-01-01",
        end_date: "2030-12-31",
      });
      
      const response = await fetch(`/api/crew-tasks?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      
      const data = await response.json();
      const taskIds = new Set<string>();
      
      // Extract unique task IDs
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((driver: any) => {
          Object.values(driver.dates).forEach((dayData: any) => {
            if (dayData.tasks) {
              dayData.tasks.forEach((task: any) => {
                taskIds.add(task.id);
              });
            }
          });
        });
      }

      // Delete tasks one by one
      let deleteCount = 0;
      for (const taskId of Array.from(taskIds)) {
        try {
          const delResponse = await fetch(`/api/crew-tasks/${taskId}`, {
            method: "DELETE",
          });
          if (delResponse.ok) deleteCount++;
        } catch (err) {
          console.error(`Failed to delete task ${taskId}`, err);
        }
      }

      setMessage({
        type: "success",
        text: `Successfully deleted ${deleteCount} tasks.`,
      });
      
      onDataCreated();
    } catch (error: any) {
      console.error("Error clearing tasks:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to clear tasks",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card className="p-4 border-dashed border-2 border-yellow-500/50 bg-yellow-500/5">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-yellow-600" />
          <h3 className="font-semibold">Test Data Manager</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Generate sample tasks for testing the shift management system. This will create various types
          of tasks including charter services, training, maintenance, and multi-day assignments.
        </p>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={createTestTasks}
            disabled={isCreating || isClearing || drivers.length === 0}
            variant="outline"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Generate Test Tasks
              </>
            )}
          </Button>

          <Button
            onClick={clearAllTasks}
            disabled={isCreating || isClearing}
            variant="destructive"
          >
            {isClearing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Tasks
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

