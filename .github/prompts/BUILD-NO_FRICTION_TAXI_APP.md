# MOTO App Development Plan

This document outlines the comprehensive plan to build the fully functional **MOTO** app, replacing the example code with a robust, scalable architecture compatible with **Expo Go**.

## 0. Development Guidelines

*   **Local First & Privacy:** **NO AUTHENTICATION REQUIRED.** The app should never ask for personal details (Email/Phone). Use Anonymous Authentication or local device IDs for any necessary backend syncing.
*   **Quality Control:** Run TypeScript validation (`npx tsc --noEmit`) after **every single iteration** or code change to ensure type safety is maintained.

## 1. Project Cleanup & Initialization

Remove the boilerplate to clear the way for the actual app code.

*   **Remove:**
    *   `src/app/web.tsx` (Unnecessary demo file)
    *   `src/constants/routes.ts` (We will use file-based routing)
    *   The entire content of `src/app/index.tsx` (Will be rewritten)
*   **Install Dependencies:**
    *   **Core:** `jotai`, `firebase`, `@react-native-async-storage/async-storage`
    *   **Maps & Location:** `react-native-maps` (Standard for Expo Go), `expo-location`
    *   **UI/Icons:** Reuse existing UI components (`Button`, `Text`) and `expo-vector-icons` (already in Expo).

## 2. State Management (Jotai + Storage)

Create a centralized store in `src/atoms`.

*   **`store.ts` (Atoms):**
    *   **`sessionAtom`**: Stores the Firebase User object.
    *   **`roleAtom`**: `'client' | 'driver' | null`. Persisted in `AsyncStorage`.
    *   **`locationAtom`**: `{ latitude, longitude }`.
    *   **`activeRideAtom`**: Stores the current ride object (ID, status, positions).

## 3. Navigation Architecture (Expo Router)

The `src/app` directory will structure the entire navigation flow.

*   **`src/app/_layout.tsx`**:
    *   Root Provider wrapper (Jotai Provider).
    *   Handles Font loading.
*   **`src/app/index.tsx` (The Brain):**
    *   **Logic:** This replaced file acts as the **Auth/Role Guard**.
    *   **Privacy:** Automatically sign in anonymously if no session exists.
    *   Check if Role is selected. No? `router.replace('/role-selector')`.
    *   Redirect to `/client` or `/driver` based on role.
*   **`src/app/auth/`**:
    *   *Deleted/Skipped* - No explicit login UI required.
*   **`src/app/role-selector.tsx`**: Simple screen with two large cards: "Passenger" & "Driver".

## 4. Client Features (Passenger)

*   **`src/app/client/home.tsx`**:
    *   **Map:** Full-screen `MapView` showing current location.
    *   **Action:** "Where to?" input and "Request Ride" button.
    *   **Logic:** Creates a document in Firestore collection `rides` with status `pending`.
*   **`src/app/client/ride.tsx`**:
    *   **Status:** Observes the Firestore document.
    *   **UI:** Shows "Waiting for driver..." -> "Driver Arriving" -> "In Progress".
    *   **Map:** Shows Driver's realtime marker moving towards user.

## 5. Driver Features

*   **`src/app/driver/dashboard.tsx`**:
    *   **Toggle:** "Go Online". Enables location streaming to Firestore `drivers` collection.
    *   **Requests:** Listens for `rides` where `status == 'pending'` nearby.
    *   **Action:** "Accept Ride" button.
*   **`src/app/driver/ride.tsx`**:
    *   **Flow:** Navigation to Pickup -> "Passenger Onboard" -> Navigation to Dropoff -> "Complete Ride".
    *   **Logic:** Updates Firestore document status at each step.

## 6. Firebase Integration

*   **Auth:** **Anonymous Auth Only.** No user data collection.
*   **Firestore Database:**
    *   `users/{userId}`: User profile and role.
    *   `rides/{rideId}`: The central object syncing Client and Driver.
        *   `status`: 'pending', 'accepted', 'in_progress', 'completed'.
        *   `origin`, `destination`, `driverId`, `clientId`.
    *   `drivers/{driverId}`: Live location updates (only when online).

## 7. Execution Steps

1.  **Clean:** Delete boilerplate files.
2.  **Config:** Create `src/config/firebase.ts` and initialize the app (Enable Anonymous Auth).
3.  **State:** Set up Jotai atoms in `src/atoms/`.
4.  **Auth Logic:** Implement auto-anonymous login in logic (No UI).
5.  **Entry Logic:** Rewrite `src/app/index.tsx` to handle the routing logic.
6.  **Core UI:** Build the Map screens for Client and Driver.
7.  **Logic:** Connect the "Request" and "Accept" buttons to Firestore.
8.  **Validation:** Run `npx tsc --noEmit`.
