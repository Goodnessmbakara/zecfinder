
ZecFinder — Product Requirements Document (PRD)
Version: 1.0
 Date: November 2025
 Prepared for: Hackathon Submission / MVP Execution
 Status: Draft

1. Executive Summary
ZecFinder is a privacy-preserving, autonomous agent wallet for Zcash that discovers, routes, and executes user intents without exposing identity or transaction linkage. The system combines stealth, precision, and automation to allow users to find privacy, execute actions, and remain untraceable.
Core Value Proposition:
 Execute cryptocurrency intents privately, efficiently, and with zero correlation risk.
MVP Goal: Build a working demo showing private intent execution and zero-link routing on Zcash.

2. Brand & Design Integration
Brand Colors (from UI system):
Role
Color
HEX
Usage
Primary
Zec Indigo
#4B5DFF
Buttons, highlights, active states
Primary Variant
Deep Indigo
#2C3EE8
Hover states, selected tabs, gradients
Secondary
Electric Emerald
#16D99B
Success indicators, wallet synced
Secondary Variant
Dark Emerald
#0FAE7C
Secondary buttons, icons, status dots
Background Light
Soft Cloud
#F7F8FA
Default light mode background
Background Dark
Midnight Graphite
#0F1115
Default dark mode background
Surface Card Light
White Fog
#FFFFFF
Cards, modals (light)
Surface Card Dark
Obsidian
#1A1D24
Cards, modals (dark)
Text Primary
Light: #0A0A0C / Dark: #F5F7FA
Primary text colors


Feedback Success
Electric Emerald
#16D99B
Success feedback

Visual Philosophy:
 High contrast, cryptographic confidence, precision detection, calm security, and modern minimalism.

3. Goals & Success Metrics
Hackathon MVP Goals:
Enable users to submit intent requests (e.g., transfer, swap, shield) via the UI.


Execute intents autonomously and privately on Zcash.


Demonstrate zero-link routing for transactions.


Optional: show context-aware agent behavior (detect intent type and choose optimal route).


Success Metrics / KPIs:
Number of intents successfully executed without identity linkage.


UI responsiveness (<2s per action).


Correct routing according to intent type.


Clear, trustable feedback using the brand’s feedback colors (success, error, info).



4. User Stories / Flow
4.1 User Personas
Privacy-Focused Trader: Wants to move funds without trace.


Automated Crypto User: Wants recurring or complex actions automated.


4.2 Core User Flows
Flow 1 — Execute Intent
User opens ZecFinder → sees dark/light dashboard.


User selects intent type (transfer, swap, shield).


ZecFinder proposes optimized route with zero-link path.


User confirms → intent executed.


Feedback displayed using Electric Emerald for success or Error Red for failures.


Flow 2 — Scan & Monitor Wallets
Dashboard shows scanned assets, shield status, and success indicators.


Scan pulse animations use brand gradient (#2C3EE8 → #4B5DFF).


Status icons leverage feedback palette: success, warning, error.


Flow 3 — Optional MPC / Keyless Safety
User selects multi-party approval option.


Agent coordinates with MPC nodes → executes intent only when approval threshold met.



5. Features & Requirements
5.1 Core MVP Features
Private Intent Execution: Full automation with stealth.


Zero-Link Routing: Automatic UTXO selection avoiding traceability.


Feedback System: Clear visual signals for success, error, warnings.


Dark/Light Mode UI: Using brand colors and component rules.


5.2 Secondary / Nice-to-Have Features
Context-Aware Agent: Auto-recognizes intent type and adjusts routing.


Recurring Actions: Schedule transfers or swaps.


Invisible Logging Mode: No persistent logs.


MPC-backed Wallet Signer: Optional keyless execution.



6. UI/UX Guidelines
Buttons: Primary = Zec Indigo, Secondary = Deep Indigo, Success = Electric Emerald, Destructive = Error Red


Input Fields: Background = Surface Card, Border = Border Neutral, Focus = Primary


Scan Frames: Glow = Brand Gradient, Pulse = Electric Emerald


Icons: Primary = Zec Indigo, Secondary = Text Secondary, Status = Feedback Palette


Maintain minimal, technical aesthetic — avoid hype or unnecessary flair



7. Architecture Overview
High-Level Components:
User Interface (Web / Mobile)


Intent input, status dashboards, dark/light theme toggle


Autonomous Agent Engine


Parses user intents → determines optimal execution paths


Zero-link routing algorithm


Transaction Executor


Interacts with Zcash nodes or multi-chain bridges


Security Layer


Optional MPC / keyless signing


Invisible logging enforcement


Feedback & Notification Module


Updates UI using brand color rules for status


Diagram Suggestion:
[User UI] -> [Agent Engine] -> [Routing & Execution] -> [Zcash Node / Multi-chain] -> [Feedback UI]


8. Technical Constraints
Must maintain transaction unlinkability.


UI should support <2s intent execution latency for hackathon demo.


Dark mode by default; light mode optional.


Use brand color palette for all components.


MPC / keyless signing optional, not required for MVP.



9. Deliverables for Hackathon
Web/mobile UI demo with dark/light theme


Functional agent executing at least one private intent type


Visual feedback using ZecFinder brand colors


Architecture diagram + PRD documentation


Optional MPC / keyless signing showcase



10. Next Steps
Confirm final intent types for MVP (transfer, swap, shield recommended).


Build UI components using brand color system.


Implement zero-link routing algorithm in agent engine.


Connect demo to Zcash Devnet / Testnet.


Prepare pitch deck and demo script for judges.




