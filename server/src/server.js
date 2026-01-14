import app from "./app.js";
import { startEscalation } from "./jobs/slaEscalation.jobs.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
    if (process.env.ENABLE_SLA_ESCALATION === "true") {
    Promise.resolve()
      .then(() => startEscalation())
      .catch((err) => console.error("[SLA JOB] Failed to start:", err));
  }
});