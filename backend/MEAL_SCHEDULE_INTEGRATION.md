# Meal Schedule Notification System - Integration Guide

## Overview

The system now supports custom meal schedules with personalized notification times. Users can add their own meals at specific times, and the system will automatically send notifications accordingly.

## Architecture

### 1. Data Flow

```
User (Frontend) → API Endpoint → User Model → Cron Scheduler → Notification Service → FCM → User Device
```

### 2. Components

#### A. User Model (`backend/models/User.js`)

- Stores `mealSchedule` object with:
  - `meals[]`: Array of meal objects (id, type, time, enabled)
  - `preferences`: Reminder settings (reminders, reminderTime, waterReminders, weekendSchedule)

#### B. Notification Routes (`backend/routes/notificationRoutes.js`)

- **Dynamic Scheduling Functions**:
  - `dateToCronTime(time)`: Converts Date to cron format
  - `scheduleUserMealReminders(userId, meals)`: Creates per-user cron jobs
  - `initializeAllUserSchedules()`: Loads all user schedules on server start
- **API Endpoints**:
  - `POST /api/notifications/meal-schedule`: Save user's meal schedule
  - `GET /api/notifications/meal-schedule`: Retrieve user's meal schedule
- **Fallback System**:
  - Global cron jobs run at default times (8 AM, 1 PM, 7 PM IST)
  - Only sends to users without custom schedules

#### C. Notification Service (`backend/services/notificationService.js`)

- Enhanced `sendMealReminder()` with support for:
  - Standard meals: Breakfast, Lunch, Dinner
  - Snacks: Morning Snack, Afternoon Snack, Evening Snack
  - Workout meals: Pre-Workout, Post-Workout
  - Custom meal types with dynamic message generation

#### D. Frontend (`app/Home/Health-Goals/meal-schedule.jsx`)

- User interface for managing meal schedule
- Saves to backend via API call
- Updates user context with new schedule

## Features

### 1. Custom Meal Times ✅

- Users can set any time for any meal
- Each meal can be enabled/disabled individually
- Drag-to-reorder meals
- Add unlimited meal slots

### 2. Supported Meal Types

- **Default**: Breakfast, Morning Snack, Lunch, Afternoon Snack, Dinner
- **Pre-defined**: Evening Snack, Pre-Workout, Post-Workout, Snack, Custom Meal
- **Dynamic**: Any custom meal name entered by user

### 3. Smart Notification System

- **Per-User Scheduling**: Each user gets individual cron jobs
- **Automatic Updates**: Changes to schedule instantly update notifications
- **Fallback**: Users without custom schedules use default times
- **Respect Settings**: Only sends if user has meal reminders enabled

### 4. Notification Messages

Each meal type has unique emojis and contextual messages:

- 🍳 Breakfast
- 🥤 Morning Snack
- 🍽️ Lunch
- 🍎 Afternoon Snack
- 🌙 Dinner
- 💪 Pre-Workout
- 🏋️ Post-Workout
- 🍿 Snack
- ⏰ Custom Meals (dynamic)

## Usage Example

### Setting Custom Meal Schedule

```javascript
// Frontend: User saves schedule
const schedule = {
  meals: [
    {
      id: 1,
      type: "Breakfast",
      time: new Date().setHours(7, 30),
      enabled: true,
    },
    {
      id: 2,
      type: "Morning Snack",
      time: new Date().setHours(10, 0),
      enabled: true,
    },
    { id: 3, type: "Lunch", time: new Date().setHours(12, 30), enabled: true },
    {
      id: 4,
      type: "Pre-Workout",
      time: new Date().setHours(16, 0),
      enabled: true,
    },
    { id: 5, type: "Dinner", time: new Date().setHours(19, 30), enabled: true },
  ],
  preferences: {
    reminders: true,
    waterReminders: true,
    weekendSchedule: true,
  },
};

// Backend automatically creates cron jobs:
// - 30 7 * * * (7:30 AM) → Breakfast
// - 0 10 * * * (10:00 AM) → Morning Snack
// - 30 12 * * * (12:30 PM) → Lunch
// - 0 16 * * * (4:00 PM) → Pre-Workout
// - 30 19 * * * (7:30 PM) → Dinner
```

### Notification Flow

1. Cron job triggers at scheduled time
2. Checks if user has meal reminders enabled in `NotificationSettings`
3. Calls `notificationService.sendMealReminder(userId, mealType)`
4. Service determines appropriate message and emoji
5. Sends FCM notification to user's device

## Default Schedule (Fallback)

Users without custom schedules receive notifications at:

- **Breakfast**: 8:00 AM IST (2:00 UTC)
- **Lunch**: 1:00 PM IST (7:00 UTC)
- **Dinner**: 7:00 PM IST (13:00 UTC)

## Technical Details

### Cron Job Management

- Jobs stored in `userSchedules` Map with userId as key
- Old jobs automatically stopped before creating new ones
- Jobs persist across requests but reset on server restart
- Server initialization loads all user schedules

### Time Conversion

```javascript
// User's local time → Date object → Cron format
const dateToCronTime = (time) => {
  const date = new Date(time);
  return `${date.getMinutes()} ${date.getHours()}`;
};
// Example: new Date().setHours(14, 30) → "30 14" → 2:30 PM daily
```

### Error Handling

- Validates userId and mealSchedule in API
- Graceful fallback if notification service fails
- Logs all operations for debugging
- Continues processing other users if one fails

## Testing

### Manual Test

1. Open app and navigate to Meal Schedule
2. Add/modify meals with custom times
3. Save the schedule
4. Wait for scheduled time
5. Verify notification arrives

### Verify Cron Jobs

Check server logs for:

```
[UserSchedule] Scheduled {MealType} at {cronTime} for userId: {userId}
[UserSchedule] Total {count} meal reminders scheduled for userId: {userId}
```

### Check Notification Delivery

```
[UserSchedule] Sending {MealType} reminder to userId: {userId} at {timestamp}
[UserSchedule] {MealType} reminder sent to userId: {userId}
```

## Future Enhancements

- [ ] Timezone support for international users
- [ ] Weekend vs. weekday schedules
- [ ] Meal prep reminders (X minutes before meal)
- [ ] Smart scheduling based on activity patterns
- [ ] Snooze functionality
- [ ] Notification history

## Related Files

- `backend/models/User.js` - User data model
- `backend/models/NotificationSettings.js` - Notification preferences
- `backend/routes/notificationRoutes.js` - API and scheduling logic
- `backend/services/notificationService.js` - Notification delivery
- `app/Home/Health-Goals/meal-schedule.jsx` - Frontend UI
