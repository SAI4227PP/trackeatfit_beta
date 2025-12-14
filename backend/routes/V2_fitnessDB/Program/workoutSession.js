/**
 * Workout Session Routes
 * Professional RESTful API routes for managing workout sessions.
 * Integrates with WorkoutSession model and follows best practices for large-scale fitness platforms.
 */
const express = require('express');
const router = express.Router();
const { WorkoutSession, IndividualWorkoutSession } = require('../../../models/V2_fitnessDB/Program/WorkoutSession');
const { getV2FitnessConnection } = require('../../../config/database');
const { V3_exerciseSchema } = require('../../../models/V2_fitnessDB/V3_exercises');
let V3_exercise;

router.use((req, res, next) => {
    if (!V3_exercise) {
        const v2Conn = getV2FitnessConnection();
        if (v2Conn) {
            V3_exercise = v2Conn.model('V3_exercise', V3_exerciseSchema, 'V3_exercises');
        }
    }
    next();
});


// --------- Individual Workout Session Routes ---------
// Create a new individual workout session
router.post('/individual', async (req, res) => {
  try {
    const session = new IndividualWorkoutSession(req.body);
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all individual workout sessions for a specific user (only exerciseId, exerciseName, caloriesBurned, sessionDate, durationInMinutes, exerciseImg)
router.get('/individual/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await IndividualWorkoutSession.find({ userId }).sort({ sessionDate: -1 });
    const CDN_URL = 'https://cdn.trackeatfit.xyz';

    // Collect all unique exerciseIds from all sessions
    const exerciseIds = [
      ...new Set(
        sessions.flatMap(session =>
          (session.exercises || []).map(ex => ex.exerciseId).filter(Boolean)
        )
      )
    ];

    // Fetch all exercises from V3_exercise in one query
    let exerciseImgs = {};
    if (exerciseIds.length && V3_exercise) {
      const v3Exercises = await V3_exercise.find(
        { _id: { $in: exerciseIds } },
        { _id: 1, mainImage: 1 }
      ).lean();
      v3Exercises.forEach(ex => {
        exerciseImgs[ex._id.toString()] = ex.mainImage
          ? ex.mainImage.replace('https://cdn.trackeatfit.xyz.s3.us-east-1.amazonaws.com', CDN_URL)
          : null;
      });
    }

    const summary = sessions.flatMap(session =>
      (session.exercises || []).map(ex => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        caloriesBurned: ex.performanceMetrics?.caloriesBurned,
        sessionDate: session.sessionDate,
        durationInMinutes: session.durationInMinutes,
        exerciseImg: exerciseImgs[ex.exerciseId?.toString()] || null
      }))
    );
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single individual workout session by its ID
router.get('/individual/:id', async (req, res) => {
  try {
    const session = await IndividualWorkoutSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an individual workout session by its ID
router.put('/individual/:id', async (req, res) => {
  try {
    const session = await IndividualWorkoutSession.findByIdAndUpdate(
      req.params.id,
      { $set: req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete an individual workout session by its ID
router.delete('/individual/:id', async (req, res) => {
  try {
    const session = await IndividualWorkoutSession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------- Program Workout Session Routes ---------
// (These must come AFTER all '/individual' routes)
// Create a new workout session
router.post('/', async (req, res) => {
  try {
    const session = new WorkoutSession(req.body);
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all workout sessions for a user (optionally filter by program)
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { programId } = req.query;
    const filter = { userId };
    if (programId) filter.programId = programId;

    // Only select fields needed for the summary
    const projection = {
      sessionDate: 1,
      programId: 1,
      programName: 1,
      title: 1,
      day: 1,
      exercises: { $slice: 1 }, // Only need the first exercise for non-program
      durationInMinutes: 1,
      totalCaloriesBurned: 1,
      status: 1
    };

    const sessions = await WorkoutSession.find(filter, projection).sort({ sessionDate: -1 }).lean();

    const summary = sessions.map(session => {
      const isProgram = !!session.programId;
      let name = '';
      let title, day;
      if (isProgram) {
        name = session.programName || '';
        title = session.title || '';
        day = session.day;
      } else if (session.exercises && session.exercises.length > 0) {
        name = session.exercises[0]?.exerciseName || '';
      }
      return {
        date: session.sessionDate,
        type: isProgram ? 'Program' : 'Workout',
        name,
        ...(isProgram ? { title } : {}),
        ...(isProgram && day !== undefined ? { day } : {}),
        duration: session.durationInMinutes ? `${session.durationInMinutes} min` : '',
        calories: session.totalCaloriesBurned || 0,
        completed: session.status === 'completed'
      };
    });

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single workout session by ID
router.get('/:id', async (req, res) => {
  try {
    const session = await WorkoutSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a workout session by ID
router.put('/:id', async (req, res) => {
  try {
    const session = await WorkoutSession.findByIdAndUpdate(
      req.params.id,
      { $set: req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a workout session by ID
router.delete('/:id', async (req, res) => {
  try {
    const session = await WorkoutSession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------- Workout Session Analytics Route ---------
// GET /analytics/user/:userId
// Returns: totalWorkouts, totalHours, totalCalories, personalRecords, weeklyActivity
router.get('/analytics/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // Get all sessions for user (both program and individual)
    const sessions = await WorkoutSession.find({ userId, status: { $in: ['completed', 'in_progress'] } });
    if (!sessions.length) {
      // Days ordered Mon-Sun
      const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      return res.json({
        totalWorkouts: 0,
        totalHours: 0,
        totalCalories: 0,
        personalRecords: {},
        weeklyActivity: days.map(day => ({ day, workouts: 0, duration: 0 })),
        today: { workouts: 0, duration: 0 },
        monthly: []
      });
    }

    // Total workouts
    const totalWorkouts = sessions.length;

    // Total hours (sum durationInMinutes)
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationInMinutes || 0), 0);
    const totalHours = +(totalMinutes / 60).toFixed(2);

    // Total calories
    const totalCalories = sessions.reduce((sum, s) => sum + (s.totalCaloriesBurned || 0), 0);

    // Personal records (max weightUsed per exerciseName)
    const prMap = {};
    sessions.forEach(session => {
      (session.exercises || []).forEach(ex => {
        if (!ex.exerciseName) return;
        let weight = 0;
        if (ex.weightUsed) {
          const match = ex.weightUsed.match(/([\d.]+)/);
          if (match) weight = parseFloat(match[1]);
        }
        if (!prMap[ex.exerciseName] || weight > prMap[ex.exerciseName].weight) {
          prMap[ex.exerciseName] = {
            weight,
            reps: ex.repsCompleted || null,
            date: session.sessionDate
          };
        }
      });
    });
    const personalRecords = Object.entries(prMap).reduce((acc, [name, val]) => {
      acc[name] = val;
      return acc;
    }, {});

    // Calculate today's stats
    const todayDate = new Date();
    const todayStr = todayDate.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    let todayWorkouts = 0;
    let todayDuration = 0;
    let todayCal = 0;
    sessions.forEach(s => {
      if (s.sessionDate) {
        const sessionDay = new Date(s.sessionDate).toISOString().slice(0, 10);
        if (sessionDay === todayStr) {
          todayWorkouts++;
          todayDuration += s.durationInMinutes || 0;
          todayCal += s.totalCaloriesBurned || 0;
        }
      }
    });

    // Define currentYear and currentMonth before using them
    const currentYear = todayDate.getFullYear();
    const currentMonth = todayDate.getMonth();

    // --- Personal Records for Today, Weekly, Monthly ---
    function getPRs(sessions) {
      const map = {};
      sessions.forEach(session => {
        (session.exercises || []).forEach(ex => {
          if (!ex.exerciseName) return;
          let weight = 0;
          if (ex.weightUsed) {
            const match = ex.weightUsed.match(/([\d.]+)/);
            if (match) weight = parseFloat(match[1]);
          }
          // Use numeric reps if possible
          const reps = ex.repsCompleted !== undefined ? ex.repsCompleted : null;
          if (!map[ex.exerciseName] || weight > map[ex.exerciseName].weight) {
            map[ex.exerciseName] = {
              weight,
              reps,
              date: session.sessionDate
            };
          }
        });
      });
      return Object.entries(map).reduce((acc, [name, val]) => {
        acc[name] = val;
        return acc;
      }, {});
    }

    // Today's PRs
    const todaySessions = sessions.filter(s => {
      if (!s.sessionDate) return false;
      const sessionDay = new Date(s.sessionDate).toISOString().slice(0, 10);
      return sessionDay === todayStr;
    });
    const personalRecordsToday = getPRs(todaySessions);

    // Weekly PRs (current week, Mon-Sun)
    function getMonday(date) {
      const d = new Date(date);
      const day = d.getDay() || 7; // 1=Mon, 7=Sun
      d.setHours(0,0,0,0);
      d.setDate(d.getDate() - (day - 1));
      return d;
    }
    function getSunday(date) {
      const d = new Date(date);
      const day = d.getDay() || 7;
      d.setHours(23,59,59,999);
      d.setDate(d.getDate() + (7 - day));
      return d;
    }
    const monday = getMonday(todayDate);
    const sunday = getSunday(todayDate);
    const weeklySessions = sessions.filter(s => {
      if (!s.sessionDate) return false;
      const d = new Date(s.sessionDate);
      return d >= monday && d <= sunday;
    });
    const personalRecordsWeekly = getPRs(weeklySessions);

    // Monthly PRs (current month)
    const monthlySessions = sessions.filter(s => {
      if (!s.sessionDate) return false;
      const d = new Date(s.sessionDate);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    const personalRecordsMonthly = getPRs(monthlySessions);

    // --- Weekly activity (Mon-Sun, with workouts and duration) ---
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const weeklyStats = Array(7).fill(0).map(() => ({ workouts: 0, duration: 0 }));
    sessions.forEach(s => {
      if (s.sessionDate) {
        const d = new Date(s.sessionDate);
        let idx = d.getDay() === 0 ? 6 : d.getDay() - 1;
        weeklyStats[idx].workouts++;
        weeklyStats[idx].duration += s.durationInMinutes || 0;
      }
    });
    const weeklyActivity = days.map((day, i) => ({
      day,
      workouts: weeklyStats[i].workouts,
      duration: weeklyStats[i].duration
    }));

    // --- Monthly stats by week (dynamic 4 or 5 weeks) ---
    // Helper: get week number in month (1-based, weeks start on Monday)
    function getWeekOfMonth(date) {
      const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const day = date.getDate();
      const firstDayWeekday = firstOfMonth.getDay() === 0 ? 7 : firstOfMonth.getDay();
      return Math.ceil((day + firstDayWeekday - 1) / 7);
    }
    // Calculate number of weeks in the current month
    // Always show 4 weeks for monthly stats
    const weeksInMonth = 4;
    const monthlyStats = Array(weeksInMonth).fill(0).map(() => ({ workouts: 0, duration: 0, cal: 0 }));
    sessions.forEach(s => {
      if (s.sessionDate) {
        const d = new Date(s.sessionDate);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          const weekIdx = getWeekOfMonth(d) - 1;
          if (weekIdx >= 0 && weekIdx < weeksInMonth) {
            monthlyStats[weekIdx].workouts++;
            monthlyStats[weekIdx].duration += s.durationInMinutes || 0;
            monthlyStats[weekIdx].cal += s.totalCaloriesBurned || 0;
          }
        }
      }
    });
    const monthly = [];
    for (let i = 0; i < weeksInMonth; i++) {
      monthly.push({
        week: i + 1,
        workouts: monthlyStats[i].workouts,
        duration: monthlyStats[i].duration,
        cal: monthlyStats[i].cal
      });
    }

    // --- Previous Day, Week, Month Stats for Compare ---

    // Previous Day
    const prevDayDate = new Date(todayDate);
    prevDayDate.setDate(todayDate.getDate() - 1);
    const prevDayStr = prevDayDate.toISOString().slice(0, 10);
    let prevDayWorkouts = 0, prevDayDuration = 0, prevDayCal = 0;
    sessions.forEach(s => {
      if (s.sessionDate) {
        const sessionDay = new Date(s.sessionDate).toISOString().slice(0, 10);
        if (sessionDay === prevDayStr) {
          prevDayWorkouts++;
          prevDayDuration += s.durationInMinutes || 0;
          prevDayCal += s.totalCaloriesBurned || 0;
        }
      }
    });

    // Previous Week (last week Mon-Sun)
    const prevMonday = new Date(monday);
    prevMonday.setDate(monday.getDate() - 7);
    const prevSunday = new Date(sunday);
    prevSunday.setDate(sunday.getDate() - 7);
    let prevWeekWorkouts = 0, prevWeekDuration = 0, prevWeekCal = 0;
    sessions.forEach(s => {
      if (s.sessionDate) {
        const d = new Date(s.sessionDate);
        if (d >= prevMonday && d <= prevSunday) {
          prevWeekWorkouts++;
          prevWeekDuration += s.durationInMinutes || 0;
          prevWeekCal += s.totalCaloriesBurned || 0;
        }
      }
    });

    // Previous Month (last calendar month)
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthYear = prevMonthDate.getFullYear();
    const prevMonthMonth = prevMonthDate.getMonth();
    let prevMonthWorkouts = 0, prevMonthDuration = 0, prevMonthCal = 0;
    sessions.forEach(s => {
      if (s.sessionDate) {
        const d = new Date(s.sessionDate);
        if (d.getFullYear() === prevMonthYear && d.getMonth() === prevMonthMonth) {
          prevMonthWorkouts++;
          prevMonthDuration += s.durationInMinutes || 0;
          prevMonthCal += s.totalCaloriesBurned || 0;
        }
      }
    });

    res.json({
      totalWorkouts,
      totalHours,
      totalCalories,
      personalRecords,
      personalRecordsToday,
      personalRecordsWeekly,
      personalRecordsMonthly,
      weeklyActivity,
      today: { workouts: todayWorkouts, duration: todayDuration, cal: todayCal },
      monthly,
      prevDay: { workouts: prevDayWorkouts, duration: prevDayDuration, cal: prevDayCal },
      prevWeek: { workouts: prevWeekWorkouts, duration: prevWeekDuration, cal: prevWeekCal },
      prevMonth: { workouts: prevMonthWorkouts, duration: prevMonthDuration, cal: prevMonthCal }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export the router
module.exports = router;
