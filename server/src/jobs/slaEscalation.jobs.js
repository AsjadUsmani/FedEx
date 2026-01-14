import cron from "node-cron";
import pool from "../db.js";

const startEscalation = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("[SLA JOB] Running SLA escalation check...");
      const result = await pool.query(
        `
        SELECT id 
        FROM cases
        WHERE status NOT IN ('CLOSED', 'ESCALATED')
          AND sla_deadline IS NOT NULL
          AND NOW() > sla_deadline
        `
      );
      for (const row of result.rows) {
        const caseId = row.id;

        // Escalate the case
        await pool.query(
          `
          UPDATE cases
          SET status = 'ESCALATED', last_update_at = NOW(), updated_at = NOW()
          WHERE id = $1
          `,
          [caseId]
        );

        // Log the escalation
        await pool.query(
          `
          INSERT INTO case_logs (case_id, action, done_by, remarks)
          VALUES ($1, $2, NULL, $3)
          `,
          [
            caseId,
            "SLA_BREACH_ESCALATED",
            "Automatically escalated due to SLA breach",
          ]
        );

        console.log(`[SLA JOB] Case ${caseId} escalated`);
      }
    } catch (error) {
      console.error("[SLA JOB] Error:", error);
    }
  });
};
export {startEscalation};
