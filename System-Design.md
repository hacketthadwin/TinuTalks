# System Design Document: Expo Mobile App Frontend

This document provides the complete, descriptive, and verified architectural breakdown and implementation details for the two main screens of your Expo React Native application.

---

## 1. Architectural Foundation and Layering

The application is built on a **Component-Based Architecture** using **React Native** and **Expo Router**. This design emphasizes separation of concerns and maintainability across all layers.

### Architectural Layers

**Routing Layer**  
- Establishes the navigation hierarchy using **Expo Router**'s file-based conventions and core React Navigation primitives (Tabs, Stack).

**Root Setup (`app/_layout.tsx`)**  
- Application wrapped in `<GestureHandlerRootView>` to ensure complex gesture libraries like the bottom sheet function correctly.

**Themed Tab Bar (`app/(tabs)/_layout.tsx`)**  
- Defines the bottom tabs navigator.  
- Centralizes theming: dark background with `#FF6B9D` accent color for a consistent user experience.

**Screens Layer**  
- Houses all screen-specific business logic:  
  - Axios data fetching  
  - State management (`useState`)  
  - Data processing  
  - UI orchestration

**Components/Presentation Layer**  
- Includes components actively consumed by the main screens for rendering or utility purposes.

---

## 2. Component Breakdown and Design Rationale (Verified Usage)

The design achieves efficiency by maximizing the reuse of core logic, even if defined locally within the screen files themselves.

### A. Reusable and Utility Components (Actively Used)

**Tinu Chat Logic (Embedded Logic) 💬**  
- Actively used in both `index.tsx` and `flashcard.tsx`.  
- Handles:
  - Local state (`chatHistory`)  
  - Chat context structures  
  - UI helper (`scrollToBottom`)  
  - Mocked API handler (`fetchTinuResponse`)  
- Promotes tight coupling and simplicity.

**WavyBackground (`app/components/Background.tsx`) ✨**  
- Actively used in `FlashCardScreen`.  
- Imported and rendered as `<WavyBackground />`.  
- Built with `react-native-svg` to create decorative, themed, non-rectangular backgrounds.

**Bottom Sheet (Third-Party) 🛠️**  
- `@gorhom/bottom-sheet` used in both screens for the modal chat interface.  
- Enabled by the `<GestureHandlerRootView>` wrapper in the root layout.

### B. Unused/Superseded Project Files (Not Used)

- **`app/components/BottomSheetContent.tsx`**: Superseded by local `renderBottomSheetContent` logic in screens.  
- **`app/components/ChatBubble.tsx`**: Superseded by locally defined ChatBubble components within `index.tsx` and `flashcard.tsx`.

---

## 3. Screen-Specific Implementation Details

### A. 'Did You Know' Screen (`app/(tabs)/index.tsx`)

**Data and Layout:**  
- Fetches content via Axios from `/p13n_answers` mock endpoint.  
- Uses horizontal `ScrollView` with `pagingEnabled` for swipe-based content navigation.

**Card Design:**  
- `renderCard` displays visually structured cards with Cause-and-Effect diagrams using inline text boxes (`conceptBoxesNew`).

**Tinu Integration Detail:**  
- Uses `expo-blur` overlay when the chat bottom sheet is open, maintaining user focus on the modal interaction.

### B. 'Flash Card' Screen (`app/(tabs)/flashcard.tsx`)

**Card Interactivity:**  
- Tap-to-flip mechanic via `<TouchableOpacity>` calling `toggleCardFlip`.  
- Manages `flippedCards` state (`Set<number>`) to reveal detailed, bulleted content.

**Chat Interaction:**  
- Suggested chips/conversation starters set `<TextInput>` value (`setChatInput(starter)`).  
- User must press send to complete the action, meeting development constraints.

---

## 4. Constraint Fulfillment and GenAI Integration

### A. Chat API Mocking Strategy

- **Simulated Backend Interaction:** `fetchTinuResponse` implements a 1500ms `setTimeout` to simulate network latency.  
- **Core Input Fulfillment:** `<TextInput>` fully functional for sending messages.  
- **Mocked Feedback Loop:** `onSendMessage` updates `chatHistory` locally and adds a mock Tinu response, creating a self-contained demo.

### B. GenAI Usage and Integration

**GenAI Systems Used:**  
- **Cursor (IDE)**  
- **GitHub Copilot (Code Completion)**

**Support Provided:**  
- **Unfamiliar Libraries:**  
  - React Native Reanimated & Bottom Sheet: Cursor guided root wrapper and snapPoints setup.  
  - React Native SVG: GenAI assisted in metro.config.js setup for `react-native-svg-transformer` to enable SVG imports.

- **Code Refinement and Stability:**  
  - Copilot assisted in clearing syntax errors, optimizing hooks (`useCallback`, `useMemo`) and improving overall code structure.
