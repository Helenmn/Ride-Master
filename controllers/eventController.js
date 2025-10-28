const pool = require('../db');

async function getAllEvents(req, res) {
  try {
    const result = await pool.query(`
      SELECT * FROM events
      WHERE event_date >= CURRENT_DATE
      ORDER BY event_date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("שגיאה בקבלת אירועים:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
}

async function addEvent(req, res) {
  const { title, type, event_date, time, location } = req.body;
  console.log("📥 גוף הבקשה שהתקבל:", req.body);

  if (!title || !type || !event_date) {
    return res.status(400).json({ message: "יש למלא את כל השדות החיוניים" });
  }

  const date = new Date(event_date);
  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const day = days[date.getDay()];

  try {
    await pool.query(
      `INSERT INTO events (title, type, event_date, time, location, day)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [title, type, event_date, time, location, day]
    );
    res.status(201).json({ message: "האירוע נוסף בהצלחה!" });
  } catch (err) {
  console.error("❌ שגיאה בהוספת אירוע:", err);  // ← הדפסה מלאה של השגיאה
  res.status(500).json({ message: "שגיאה בהוספת אירוע" });
}

}

async function joinRide(req, res) {
  const { event_id, driver_user_id, passenger_user_id } = req.body;

  if (!event_id || !driver_user_id || !passenger_user_id) {
    return res.status(400).json({ message: "חסרים שדות נדרשים" });
  }

  if (parseInt(driver_user_id) === parseInt(passenger_user_id)) {
    return res.status(400).json({ message: "נהג אינו יכול להירשם לנסיעה של עצמו" });
  }

  try {
    const exists = await pool.query(
      `SELECT * FROM event_passengers 
       WHERE event_id = $1 AND driver_user_id = $2 AND passenger_user_id = $3`,
      [event_id, driver_user_id, passenger_user_id]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ message: "כבר נרשמת לנסיעה זו" });
    }

    const available = await pool.query(
      `SELECT seats_available FROM event_drivers 
       WHERE event_id = $1 AND user_id = $2`,
      [event_id, driver_user_id]
    );

    if (available.rows.length === 0 || available.rows[0].seats_available <= 0) {
      return res.status(400).json({ message: "אין מקומות פנויים בנסיעה זו" });
    }

    await pool.query(
      `INSERT INTO event_passengers 
       (event_id, driver_user_id, passenger_user_id, status)
       VALUES ($1, $2, $3, 'pending')`,
      [event_id, driver_user_id, passenger_user_id]
    );
    
    res.status(200).json({ message: "נרשמת בהצלחה לנסיעה!" });
  } catch (err) {
    console.error("שגיאה בהרשמה לנסיעה:", err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
}
async function deleteEvent(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM events WHERE id = $1', [id]);
    res.json({ message: "האירוע נמחק בהצלחה" });
  } catch (err) {
    console.error("שגיאה במחיקת אירוע:", err);
    res.status(500).json({ message: "שגיאה במחיקת אירוע" });
  }
}
async function getEventById(req, res) {
  const eventId = req.params.id;
  try {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "אירוע לא נמצא" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("שגיאה בשליפת אירוע:", err);
    res.status(500).json({ message: "שגיאה בשליפת אירוע" });
  }
}
async function updateEvent(req, res) {
  const eventId = req.params.id;
  const { title, type, event_date, time, location } = req.body;
  try {
    await pool.query(
      `UPDATE events
       SET title = $1, type = $2, event_date = $3, time = $4, location = $5
       WHERE id = $6`,
      [title, type, event_date, time, location, eventId]
    );
    res.json({ message: "האירוע עודכן בהצלחה" });
  } catch (err) {
    console.error("שגיאה בעדכון אירוע:", err);
    res.status(500).json({ message: "שגיאה בעדכון אירוע" });
  }
}



module.exports = {
  getAllEvents,
  addEvent,
  joinRide,
  deleteEvent,
  updateEvent,
  getEventById
};
