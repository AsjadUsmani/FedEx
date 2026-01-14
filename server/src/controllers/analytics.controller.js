import pool from "../db.js";

export const overview = async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin only" });
  }
  try {
    // 1.Totals
    const totalsResult = await pool.query(`
      SELECT
        COUNT(*) AS all,
        COUNT(*) FILTER (WHERE status IN ('NEW', 'ASSIGNED', 'IN_PROGRESS')) AS open,
        COUNT(*) FILTER (WHERE status = 'CLOSED') AS closed,
        COUNT(*) FILTER (WHERE status = 'ESCALATED') AS escalated
      FROM cases
    `);
    const totals = totalsResult.rows[0];

    // 2. slaStats
    const slaResult = await pool.query(`
        SELECT 
            COUNT(*) AS breached,
            COUNT(*) FILTER (
          WHERE status = 'ESCALATED'
            AND updated_at > NOW() - INTERVAL '24 hours'
        ) AS breached_last_24h
        FROM cases
        WHERE status = 'ESCALATED'
    `);

    const sla = slaResult.rows[0];

    // 3. DCA performance

    const dcaResult = await pool.query(`
      SELECT
        d.id AS dca_id,
        d.name AS dca_name,
        COUNT(c.id) AS total_cases,
        COUNT(c.id) FILTER (WHERE c.status = 'ESCALATED') AS escalated,
        AVG(
          EXTRACT(EPOCH FROM (c.updated_at - c.assigned_at)) / 86400
        ) FILTER (WHERE c.status = 'CLOSED') AS avg_resolution_days
      FROM dcas d
      LEFT JOIN cases c ON c.assigned_dca = d.id
      GROUP BY d.id, d.name
      ORDER BY escalated DESC NULLS LAST
    `);

    return res.json({
      totals,
      sla,
      dca_performance: dcaResult.rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
