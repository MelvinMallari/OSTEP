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
    jobs.forEach((job) => {
      if (!job.enqueued && job.arrivalTime <= currentTime) {
        queues[0].push(job);
        job.enqueued = true;
      }
    });

    // Find the highest‐priority nonempty queue and job to run
    const queueIndex = queues.findIndex((queue) => queue.length > 0);

    // If no job is ready, CPU is idle
    if (queueIndex === -1) {
      executionTimeline.push(`${currentTime}-${currentTime + 1}: IDLE`);
      currentTime++;
      continue;
    }

    const jobToRun = queues[queueIndex].shift()!;

    // Job runs for remaining time or for entire quantum
    const quantum: number = timeQuantums[queueIndex];
    const runTime: number = Math.min(quantum, jobToRun.remainingTime);

    // Add job to execution timeline
    executionTimeline.push(
      `${currentTime}-${currentTime + runTime}: ${
        jobToRun.id
      } (Level ${queueIndex})`
    );

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

  // Calculate job statistics and print results
  console.log("\n--- Job Stats ---");
  return inputJobs.map((originalJob: Job) => {
    const trackedJob = jobs.find((j: TrackedJob) => j.id === originalJob.id)!;
    const turnaroundTime = trackedJob.completionTime! - trackedJob.arrivalTime;
    const waitingTime = turnaroundTime - trackedJob.burstTime;

    console.log(
      `${trackedJob.id} | Turnaround Time: ${turnaroundTime}, Waiting Time: ${waitingTime}`
    );

    return { id: trackedJob.id, turnaroundTime, waitingTime };
  });
}

// Test cases
const quantumTests: number[][] = [
  [5, 10, 20],
  [2, 4, 8],
  [8, 16, 32],
  [3, 6, 12],
  [10, 20, 40],
];

// Run tests
quantumTests.forEach((quantums, idx) => {
  console.log(`=== Test ${idx + 1}: Quantums = [${quantums}] ===`);
  runMLFQ(quantums);
});
