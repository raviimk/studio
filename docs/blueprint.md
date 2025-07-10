# **App Name**: Gem Tracker

## Core Features:

- Sarin Packet Entry: Enable the creation of new Sarin diamond packets with details such as sender name, operator, machine, kapan number, lot number, packet count, and Jiram details; stores data in localStorage.
- Sarin Lot Management: Allows Sarin lot returns, updating the isReturned status in localStorage, and displaying recent Sarin entries with deletion options.
- Laser Lot Tracking: Supports creation of new Laser lots with lot number, tension type, machine (auto-filled), kapan number, and packet count, stored in localStorage, with lot return functionality and operator selection.
- Control Panel: Facilitates managing operators (Sarin and Laser) and their machine assignments via a control panel, storing configurations in localStorage.
- Packet Reassignment: Allows reassignment of Sarin packets from one operator to another, updating localStorage and maintaining a reassignment log.
- Performance Dashboard: Presents a performance dashboard with total packets, Jiram packets, returned lots, and top performers, all sourced from localStorage.
- Operational Insight Generator: Uses generative AI to offer data-driven insights to guide operational improvements in diamond production and tracking, based on historic local storage records. The AI acts as a tool that identifies patterns in production metrics.

## Style Guidelines:

- Primary color: Deep blue (#2E4765) to convey professionalism and trust.
- Background color: Light gray (#EAEAEA) to provide a clean, neutral backdrop.
- Accent color: Soft gold (#D4A276) to highlight important actions and data, reflecting the precious nature of diamonds.
- Body font: 'Inter' sans-serif font providing a modern and readable text.
- Headline font: 'Space Grotesk' sans-serif for a tech-forward feel; use for headlines only and 'Inter' for body.
- Use a set of simple, consistent icons for navigation and actions.
- Responsive layout that adapts to different screen sizes (desktop, tablet, mobile).