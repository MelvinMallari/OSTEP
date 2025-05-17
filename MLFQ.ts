// Multi-Level Feedback Queue (MLFQ) Scheduler in JavaScript

/**
 * QUANTUM TEST FINDINGS:
 *
 * 1. Larger quantums ([10, 20, 40]) produced the best overall performance with:
 *    - Lowest average turnaround time: 15 (vs. 16.67-19.67 for other tests)
 *    - Lowest average waiting time: 7.33 (vs. 9-12 for other tests)
 *    - Job A completed with zero waiting time
 *
 * 2. Smaller quantums ([2, 4, 8]) increased context switching but didn't improve
 *    overall job performance metrics, resulting in higher average waiting times.
 *
 * 3. Medium-range quantums showed varying results depending on how well they aligned
 *    with the actual job burst times.
 *
 * 4. The results demonstrate the classic tradeoff: smaller quantums improve responsiveness
 *    for short jobs but increase overhead from context switching, while larger quantums
 *    reduce overhead but can delay short jobs behind longer ones.
 */

// Time slices per priority level
// Short quanta for high-priority (interactive) tasks keep latency low.
// Longer quanta at lower levels reduce context-switch overhead for long-running jobs.
const timeQuantums: number[] = [5, 10, 20];
const maxLevel: number = timeQuantums.length - 1;

// Define jobs with: id, arrivalTime, burstTime
interface Job {
  id: string;
  arrivalTime: number;
  burstTime: number;
}

interface TrackedJob extends Job {
  remainingTime: number;
  currentLevel: number;
  completionTime: number | null;
  enqueued: boolean;
}

const inputJobs: Job[] = [
  { id: "A", arrivalTime: 0, burstTime: 10 },
  { id: "B", arrivalTime: 1, burstTime: 5 },
  { id: "C", arrivalTime: 2, burstTime: 8 },
];

interface JobStats {
  id: string;
  turnaroundTime: number;
  waitingTime: number;
}

function runMLFQ(timeQuantums: number[]): JobStats[] {
  const maxLevel: number = timeQuantums.length - 1;

  // Deep copy of jobs for tracking runtime info
  const jobs: TrackedJob[] = inputJobs.map((job: Job) => ({
    ...job,
    remainingTime: job.burstTime,
    currentLevel: 0,
    completionTime: null,
    enqueued: false,
  }));

  let currentTime: number = 0;
  let jobsFinished: number = 0;
  const queues: TrackedJob[][] = timeQuantums.map(() => []); // One queue per level
  const executionTimeline: string[] = [];

  // Main simulation loop
  while (jobsFinished < jobs.length) {
    // Enqueue newly arrived jobs to the highest-priority queue
    jobs.forEach((job: TrackedJob) => {
      if (!job.enqueued && job.arrivalTime <= currentTime) {
        queues[0].push(job);
        job.enqueued = true;
      }
    });

    // Find the highest‐priority nonempty queue
    let jobToRun: TrackedJob | undefined = undefined;
    let queueLevel: number = 0;

    for (; queueLevel <= maxLevel; queueLevel++) {
      if (queues[queueLevel].length > 0) {
        jobToRun = queues[queueLevel].shift();
        break;
      }
    }

    // If no job is ready, CPU is idle
    if (!jobToRun) {
      executionTimeline.push(`${currentTime}-${currentTime + 1}: IDLE`);
      currentTime++;
      continue;
    }

    // Job runs for remaining time or for entire quantum
    const quantum: number = timeQuantums[queueLevel];
    const runTime: number = Math.min(quantum, jobToRun.remainingTime);

    const timeRange: string = `${currentTime}-${currentTime + runTime}`;
    const jobInfo: string = `${jobToRun.id} (Level ${queueLevel})`;
    executionTimeline.push(`${timeRange}: ${jobInfo}`);

    // Update job's remaining time and current time
    jobToRun.remainingTime -= runTime;
    currentTime += runTime;

    if (jobToRun.remainingTime === 0) {
      jobToRun.completionTime = currentTime;
      jobsFinished++;
    } else {
      // Demote to lower level if not already at the lowest
      jobToRun.currentLevel = Math.min(jobToRun.currentLevel + 1, maxLevel);
      queues[jobToRun.currentLevel].push(jobToRun);
    }
  }

  // Print execution timeline
  console.log("--- CPU Timeline ---");
  console.log(executionTimeline.join("\n"));

  // Calculate and print job statistics
  console.log("\n--- Job Stats ---");
  const jobStats: JobStats[] = inputJobs.map((originalJob: Job) => {
    const trackedJob = jobs.find((j: TrackedJob) => j.id === originalJob.id);
    if (!trackedJob || trackedJob.completionTime === null) {
      // Handle the case where the job or completion time is not found,
      // though in this algorithm, it should always be found.
      // This satisfies TypeScript's null checks.
      console.error(`Error: Job ${originalJob.id} not processed correctly.`);
      return {
        id: originalJob.id,
        turnaroundTime: -1, // Or some other indicator of an error
        waitingTime: -1, // Or some other indicator of an error
      };
    }
    const turnaroundTime: number =
      trackedJob.completionTime - trackedJob.arrivalTime;
    const waitingTime: number = turnaroundTime - trackedJob.burstTime;

    console.log(
      `${trackedJob.id} | Turnaround Time: ${turnaroundTime}, Waiting Time: ${waitingTime}`
    );
    return {
      id: trackedJob.id,
      turnaroundTime,
      waitingTime,
    };
  });
  return jobStats;
}

const defaultQuantums: number[] = [5, 10, 20];

const quantumTests: number[][] = [
  [5, 10, 20],
  [2, 4, 8],
  [8, 16, 32],
  [3, 6, 12],
  [10, 20, 40],
];

quantumTests.forEach((quantums, idx) => {
  console.log(
    `\n===== Test ${idx + 1}: Quantums = [${quantums.join(", ")}] =====`
  );
  runMLFQ(quantums);
});
