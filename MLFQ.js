// Multi-Level Feedback Queue (MLFQ) Scheduler in JavaScript
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var inputJobs = [
    { id: "A", arrivalTime: 0, burstTime: 10 },
    { id: "B", arrivalTime: 1, burstTime: 5 },
    { id: "C", arrivalTime: 2, burstTime: 8 },
];
function runMLFQ(timeQuantums) {
    var maxLevel = timeQuantums.length - 1;
    // Deep copy of jobs for tracking runtime info
    var jobs = inputJobs.map(function (job) { return (__assign(__assign({}, job), { remainingTime: job.burstTime, currentLevel: 0, completionTime: null, enqueued: false })); });
    var currentTime = 0;
    var jobsFinished = 0;
    var queues = timeQuantums.map(function () { return []; }); // One queue per level
    var executionTimeline = [];
    // Main simulation loop
    while (jobsFinished < jobs.length) {
        // Enqueue newly arrived jobs to the highest-priority queue
        jobs.forEach(function (job) {
            if (!job.enqueued && job.arrivalTime <= currentTime) {
                queues[0].push(job);
                job.enqueued = true;
            }
        });
        // Find the highest‐priority nonempty queue and job to run
        var queueIndex = queues.findIndex(function (queue) { return queue.length > 0; });
        // If no job is ready, CPU is idle
        if (queueIndex === -1) {
            executionTimeline.push("".concat(currentTime, "-").concat(currentTime + 1, ": IDLE"));
            currentTime++;
            continue;
        }
        var jobToRun = queues[queueIndex].shift();
        // Job runs for remaining time or for entire quantum
        var quantum = timeQuantums[queueIndex];
        var runTime = Math.min(quantum, jobToRun.remainingTime);
        // Add job to execution timeline
        executionTimeline.push("".concat(currentTime, "-").concat(currentTime + runTime, ": ").concat(jobToRun.id, " (Level ").concat(queueIndex, ")"));
        // Update job's remaining time and current time
        jobToRun.remainingTime -= runTime;
        currentTime += runTime;
        if (jobToRun.remainingTime === 0) {
            jobToRun.completionTime = currentTime;
            jobsFinished++;
        }
        else {
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
    return inputJobs.map(function (originalJob) {
        var trackedJob = jobs.find(function (j) { return j.id === originalJob.id; });
        var turnaroundTime = trackedJob.completionTime - trackedJob.arrivalTime;
        var waitingTime = turnaroundTime - trackedJob.burstTime;
        console.log("".concat(trackedJob.id, " | Turnaround Time: ").concat(turnaroundTime, ", Waiting Time: ").concat(waitingTime));
        return { id: trackedJob.id, turnaroundTime: turnaroundTime, waitingTime: waitingTime };
    });
}
// Test cases
var quantumTests = [
    [5, 10, 20],
    [2, 4, 8],
    [8, 16, 32],
    [3, 6, 12],
    [10, 20, 40],
];
quantumTests.forEach(function (quantums, idx) {
    console.log("=== Test ".concat(idx + 1, ": Quantums = [").concat(quantums, "] ==="));
    runMLFQ(quantums);
});
