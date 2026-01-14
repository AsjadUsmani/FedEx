import pool from "../db.js";

export const createCase = async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Only Admin can create cases" });
  }

  const { customer_name, amount_due, due_date } = req.body;

  if (!customer_name || !amount_due || !due_date) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO cases (customer_name, amount_due, due_date) VALUES ($1, $2, $3) RETURNING *",
      [customer_name, amount_due, due_date]
    );

    const newCase = result.rows[0];

    await pool.query(
      `INSERT INTO case_logs (case_id, action, done_by, remarks)
       VALUES ($1, $2, $3, $4)`,
      [newCase.id, "CASE_CREATED", req.user.userId, "Case created by Admin"]
    );

    return res.status(201).json(newCase);
  } catch (err) {
    return res.status(500).json({ error: `Server error ${err}` });
  }
};

export const listCases = async (req, res) => {
  try {
    let result;
    if (req.user.role === "ADMIN") {
      result = await pool.query("SELECT * FROM cases ORDER BY created_at DESC");
    } else {
      result = await pool.query(
        "SELECT * FROM cases WHERE assigned_dca = $1 ORDER BY created_at DESC",
        [req.user.dcaId]
      );
    }
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: `Server error ${err}` });
  }
};

export const assignCase = async (req, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Only Admin can assign cases" });
  }
  const caseId = req.params.id;
  const { dca_id } = req.body;

  if (!dca_id) {
    return res.status(400).json({ error: "dca_id is required" });
  }
  try {
    const result = await pool.query(
      `UPDATE cases
       SET assigned_dca = $1,
           status = 'ASSIGNED',
           assigned_at = NOW(),
           last_update_at = NOW(),
           sla_deadline = NOW() + INTERVAL '48 hours',
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [dca_id, caseId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Case not found" });
    }
    const updated = result.rows[0];

    await pool.query(
      `INSERT INTO case_logs (case_id, action, done_by, remarks)
       VALUES ($1, $2, $3, $4)`,
      [
        updated.id,
        "CASE_ASSIGNED",
        req.user.userId,
        `Assigned to DCA ${dca_id}`,
      ]
    );
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: `Server error ${err}` });
  }
};

export const updateCaseStatus = async (req, res) => {
  if (req.user.role !== "DCA_USER") {
    return res.status(403).json({ error: "Only DCA users can update status" });
  }
  const caseId = req.params.id;
  const { status, remarks } = req.body;

  if (!status) {
    return res.status(400).json({ error: "status is required" });
  }

  try {
    // Ensure this case belongs to this DCA
    const check = await pool.query(
      `SELECT id FROM cases WHERE id = $1 AND assigned_dca = $2`,
      [caseId, req.user.dcaId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ error: "Access denied to this case" });
    }

    const result = await pool.query(
      `UPDATE cases
       SET status = $1, 
           last_update_at = NOW(),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, caseId]
    );

    const updated = result.rows[0];

    await pool.query(
      `INSERT INTO case_logs (case_id, action, done_by, remarks)
       VALUES ($1, $2, $3, $4)`,
      [updated.id, "STATUS_UPDATED", req.user.userId, remarks || ""]
    );
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ error: `Server error ${err}` });
  }
};
