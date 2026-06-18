# taskflow

A GTD-style (Getting Things Done) task manager for iOS and Android, built with Expo and React Native.

## Features

- **Inbox, Today, Calendar, Projects, Settings** tabs with swipe navigation
- **Tasks** with priority (low/medium/high), due dates, status (waiting/someday), project assignment, and tags
- **Natural-language date parsing** in task titles: type "today", "tomorrow", "monday", or German equivalents ("heute", "morgen", "montag", ...) and the due date is set automatically
- **Projects** with name, description, goal, color, and archive support
- **Tags** with optional color
- **Local persistence** via AsyncStorage (JSON)
- **Export / import** as a JSON file using the native share sheet
- **WebDAV / Nextcloud sync** with last-write-wins conflict resolution; supports force-push and force-pull
- **Daily task reminder** notification at a configurable time (native platforms only); the reminder shows how many tasks are scheduled for today and the count refreshes on app launch
- **Light / dark / system** theme, persisted across sessions

## Tech Stack

- React Native 0.81 / React 19
- Expo 54 (new architecture enabled, React Compiler enabled)
- expo-router 6 (file-based routing, typed routes)
- TypeScript 5.9
- `@react-native-async-storage/async-storage` for local storage
- `webdav` library for WebDAV/Nextcloud sync
- `expo-notifications` for push notifications
- `expo-sharing` + `expo-file-system` for data export/import
- `@react-navigation/material-top-tabs` for swipeable tab navigation

## Prerequisites

- Node.js 18+
- npm
- Expo Go app (for quick preview) or a development build for full native features (notifications, file sharing)

## Getting Started

```bash
npm install
```

| Script | Command | Description |
|---|---|---|
| start | `npm start` | Start Expo dev server |
| android | `npm run android` | Open on Android emulator/device |
| ios | `npm run ios` | Open on iOS simulator/device |
| web | `npm run web` | Open in browser |
| lint | `npm run lint` | Run ESLint |

## Project Structure

```
app/
  (tabs)/
    index.tsx        # Inbox
    today.tsx        # Today's tasks
    calendar.tsx     # Calendar view
    projects.tsx     # Projects list
    settings.tsx     # Settings (theme, notifications, sync, export)
  archive.tsx        # Archived projects
  modal.tsx          # Task create/edit modal
  project-modal.tsx  # Project create/edit modal
  project/[id].tsx   # Project detail
  webdav-setup.tsx   # WebDAV/Nextcloud connection setup
components/          # Shared UI components
constants/theme.ts   # Color tokens for light/dark
contexts/
  theme-context.tsx  # ThemeProvider + useTheme hook
hooks/               # useColorScheme, useThemeColor
services/
  storage.service.ts  # AsyncStorage persistence + export/import
  webdav.service.ts   # WebDAV sync
  notification.service.ts  # Daily reminders
  task.service.ts
  project.service.ts
  tag.service.ts
types/gtd.ts         # Task, Project, Tag, GTDData types
utils/
  date-parser.ts     # Natural-language date extraction from task titles
  id-generator.ts
```

## Data and Sync

All data is stored locally as a single JSON document (`GTDData`) in AsyncStorage. The schema includes tasks, projects, tags, a version field, and sync metadata (timestamp + hash).

**Export/Import:** The settings screen lets you export the full dataset as `taskflow-export-<timestamp>.json` via the native share sheet and import from any `.json` file on device.

**WebDAV/Nextcloud sync:** Configure a server URL, username, and password in the WebDAV setup screen. Syncing uses a last-write-wins strategy based on the `lastSync` timestamp stored in the JSON file. Force-push and force-pull are available for manual conflict resolution. WebDAV is not supported on web.
