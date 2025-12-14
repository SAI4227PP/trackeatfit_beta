const mongoose = require('mongoose');

/**
 * SessionLogSchema
 * Stores information about a single workout session for a user within a program.
 * Includes completed exercises, session ratings, duration, and flags for rest/recovery/missed days.
 */
const SessionLogSchema = new mongoose.Schema({
  day: { type: Number, required: true }, // 1–7 (based on program schedule)
  date: { type: Date, default: Date.now }, // Date when the session was performed
  completedExercises: [
    {
      exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'V3_exercises' }, // Reference to exercise
      exerciseName: { type: String }, // Name of the exercise
      setsCompleted: { type: String }, // Sets completed (string for flexibility)
      repsCompleted: { type: String }, // Reps completed (string for flexibility)
      notes: { type: String }, // User notes for this exercise
      skipped: { type: Boolean, default: false } // Whether this exercise was skipped
    }
  ],
  rating: { type: Number, min: 0, max: 5 }, // User rating for the session
  energyLevel: { type: Number, min: 1, max: 5 }, // 1 (exhausted) to 5 (very energetic)
  difficultyRating: { type: Number, min: 1, max: 5 }, // 1 (very easy) to 5 (very hard)
  adjustmentSuggestion: { type: String, enum: ['easier', 'same', 'harder'], default: 'same' }, // Feedback-based

  durationInMinutes: { type: Number }, // Duration of the session
  isRecoveryDay: { type: Boolean, default: false }, // If the session was a recovery day
  isMissed: { type: Boolean, default: false }, // If the session was missed
  isRestDay: { type: Boolean, default: false }, // If the session was a rest day
  notes: { type: String }, // Additional notes for the session
  completedAt: { type: Date, default: Date.now } // Timestamp when session was completed
});

/**
 * UserProgramProgressSchema
 * Tracks a user's progress through a specific exercise program.
 * Stores session logs, progress stats, and feedback.
 */
const UserProgramProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to user
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExerciseProgram', required: true }, // Reference to program
  programName: { type: String }, // Name of the program

  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'paused', 'completed'],
    default: 'not_started'
  }, // Current status of the program for the user

  startedAt: { type: Date }, // When the user started the program
  lastSessionAt: { type: Date }, // Last session date
  completedAt: { type: Date }, // When the program was completed

  completedDays: [{ type: Number }], // Days completed by the user
  skippedDays: [{ type: Number }], // Days with skipped exercises
  restDays: [{ type: Number }], // Days marked as rest
  missedDays: [{ type: Number }], // Days missed

  progressPercentage: { type: Number, default: 0, min: 0, max: 100 }, // Progress in percent
  totalSessionsCompleted: { type: Number, default: 0 }, // Total sessions completed
  totalMinutesTrained: { type: Number, default: 0 }, // Total minutes trained

  sessionLogs: [SessionLogSchema], // Array of session logs

  ratingGiven: { type: Number, min: 0, max: 5 }, // User's overall rating for the program
  feedback: { type: String }, // User's feedback

  createdBy: { type: String, default: 'system' }, // Who created the record
  createdAt: { type: Date, default: Date.now }, // When the record was created
  updatedAt: { type: Date, default: Date.now } // When the record was last updated
}, {
  collection: 'user_program_progress'
});

/**
 * Utility: Recalculates progress statistics for the user in the program.
 * Updates completed/rest/skipped/missed days, total sessions, minutes trained, and progress percentage.
 * Marks program as completed if progress reaches 100%.
 */
UserProgramProgressSchema.methods.recalculateProgress = function (totalProgramDays = 7) {
  const logs = this.sessionLogs || [];

  // Count completed sessions (not missed or rest)
  const completed = logs.filter(l => !l.isMissed && !l.isRestDay).length;
  // Get rest days
  const rest = logs.filter(l => l.isRestDay).map(l => l.day);
  // Get missed days
  const missed = logs.filter(l => l.isMissed).map(l => l.day);
  // Get skipped exercises
  const skipped = logs.flatMap(l =>
    l.completedExercises.filter(e => e.skipped).map(() => l.day)
  );

  const minutesTrained = logs.reduce((sum, l) => sum + (l.durationInMinutes || 0), 0);

  // Update arrays
  this.completedDays = logs.filter(l => !l.isMissed && !l.isRestDay).map(l => l.day);
  this.restDays = [...new Set(rest)];
  this.skippedDays = [...new Set(skipped)];
  this.missedDays = [...new Set(missed)];
  
  // Update total sessions - now including both completed and missed sessions
  // We don't count rest days in the total
  this.totalSessionsCompleted = completed + this.missedDays.length;
  this.totalMinutesTrained = minutesTrained;
  this.progressPercentage = Math.min(100, Math.round((completed / totalProgramDays) * 100));

  // If all sessions are either completed or missed, and at least one is missed, set to 'paused'.
  if ((completed + this.missedDays.length) >= totalProgramDays) {
    if (completed === totalProgramDays) {
      this.status = 'completed';
      this.completedAt = new Date();
    } else if (this.missedDays.length > 0) {
      this.status = 'paused';
      this.completedAt = new Date();
    }
  }

  this.updatedAt = new Date();
};

/**
 * Utility: Calculates missed days based on the program schedule and current date.
 * Compares scheduled session days with completed days to determine missed days.
 */
UserProgramProgressSchema.methods.calculateMissedDays = function(programSchedule) {
  // Get all scheduled session days up to current date
  const startDate = new Date(this.startedAt || this.createdAt);
  startDate.setHours(0, 0, 0, 0);
  
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  const daysSinceStart = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
  
  // Get completed and rest days
  const completedDays = new Set(this.sessionLogs.filter(log => !log.isMissed && !log.isRestDay).map(log => log.day));
  const restDays = new Set(this.sessionLogs.filter(log => log.isRestDay).map(log => log.day));
  
  // Track missed days
  const missedDays = [];
  
  // Calculate which days should have been completed by now
  for (let i = 0; i < programSchedule.length; i++) {
    const scheduledSession = programSchedule[i];
    const dayInSchedule = scheduledSession.day;
    
    const scheduledDate = new Date(startDate);
    scheduledDate.setDate(startDate.getDate() + dayInSchedule - 1);
    scheduledDate.setHours(0, 0, 0, 0);

    // Skip today's session - it can't be missed yet
    if (scheduledDate.getTime() === currentDate.getTime()) {
      continue;
    }

    // If this scheduled day has passed (before today) and wasn't completed
    if (scheduledDate < currentDate && !completedDays.has(dayInSchedule)) {
      // Check if it wasn't a rest day in schedule and not marked as rest
      if (!scheduledSession.isRestDay && !restDays.has(dayInSchedule)) {
        missedDays.push(dayInSchedule);
      }
    }
  }
  
  // Update missed days
  this.missedDays = missedDays;
  
  // Update sessionLogs for missed days
  missedDays.forEach(day => {
    // Only add if not already logged
    const existingLog = this.sessionLogs.find(log => log.day === day);
    if (!existingLog) {
      this.sessionLogs.push({
        day,
        date: new Date(startDate.getTime() + (day - 1) * 24 * 60 * 60 * 1000),
        isMissed: true,
        completedExercises: []
      });
    }
  });
  
  // Recalculate progress to account for missed sessions
  if (missedDays.length > 0) {
    const totalProgramDays = programSchedule.filter(session => !session.isRestDay).length;
    this.recalculateProgress(totalProgramDays);
  }
  
  return missedDays;
};

// Add indexes for performance
UserProgramProgressSchema.index({ userId: 1 });
UserProgramProgressSchema.index({ userId: 1, programId: 1 });

const UserProgramProgress = mongoose.model('UserProgramProgress', UserProgramProgressSchema);

module.exports = {
  SessionLogSchema,
  UserProgramProgressSchema,
  UserProgramProgress
};
