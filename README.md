# ClaimKeeper — Consumer Policy Versioning & Evidence Engine
> **"Keep the Policy. Keep the Proof."**

ClaimKeeper is an auditable, consumer-facing web application designed to track, archive, and compare public retailer policies (returns, warranties, subscription terms, and drop-off conditions). It empowers everyday shoppers and subscribers by transforming fragile screenshots and lost bookmarks into court- and chargeback-ready evidence dossiers.

---

## The Problem Statement: "The Fragile Record"

Online retailers and subscription platforms regularly alter their customer terms without notifying consumers:
1. **Bookmarks save destinations, not wording:** A bookmark only preserves the current page; when return windows are shortened from 14 days to 7 days, the prior terms disappear.
2. **Screenshots become scattered, unverified files:** Screenshots lack cryptographically verifiable capture timestamps, official source linkage, and metadata required by credit card dispute handlers.
3. **Silent shifts in legal agreements:** Return windows contract, drop-off fees are added for third-party carriers, and household streaming limits are tightened.
4. **Manual comparisons are tedious:** Searching through scattered emails, photos, and browser histories makes assembling dispute evidence painful for consumers.

---

## The Solution: A 5-Stage Policy Lineage Engine

```
[01 Submit] → [02 Retrieve] → [03 Store] → [04 Compare] → [05 Report]
   URL &       TinyFish        SHA-256 Hash    Deterministic   Audit-Grade
   Label       Adapter         & Timestamp     Text Diff       Dispute Pack
```

### Core Capabilities & Innovations
- **Timestamped Version Lineage:** Every capture carries an exact ISO timestamp, normalized text, source URL, and unique version identifier (v1, v2, etc.).
- **Cryptographic SHA-256 Checksums:** Tamper-evident 256-bit hash fingerprints computed via the Web Crypto API guarantee text integrity.
- **"Failed Fetch ≠ Change" Trust Boundary:** If a merchant site experiences downtime or a network error (HTTP 502/504), the error is logged to the audit status. **It is never treated as a policy change**, safeguarding your dispute evidence from corruption.
- **Deterministic Diff Engine:** Word-level diffing clearly highlights added text in emerald green and deleted text in rose red. Original wording remains the unadulterated source of truth.
- **Audit-Grade Dispute Dossier (Print/PDF):** Formats comprehensive, printable evidence packages including verified URLs, checksums, comparative diffs, timeline logs, and pre-formatted dispute letters for customer support or credit card chargebacks.
- **Verified Official Brand Links:** Every card and modal includes direct links to official company sites (`apple.com`, `amazon.com`, `netflix.com`, `zara.com`, `bestbuy.com`, `steampowered.com`, etc.).
- **Full Removal & Subscription Management:** Safe, 1-click removal of any tracked policy or subscription with a confirmation modal and undo restoration toast.

---

## Quick Start & Running the Website

### Option 1: Direct Browser Launch (Zero Installation)
Double-click `start.bat` or open `index.html` directly in any web browser (Google Chrome, Microsoft Edge, Brave, Firefox, or Safari).

### Option 2: Local Server via PowerShell
Open a terminal in this directory and run:
```powershell
powershell -ExecutionPolicy Bypass -File .\start-server.ps1
```
This boots an HTTP server on `http://localhost:3000` with static asset delivery and mock REST endpoints (`/api/policies`, `/api/health`).

---

## File Architecture

- `index.html`: Modern, responsive single-page application with dark-mode obsidian glassmorphism, search and category filtering, diff modal, printable evidence dossier modal, and official brand directory.
- `app.js`: Client-side engine providing LocalStorage persistence, Web Crypto SHA-256 computation, word-level Myers/LCS diff algorithm, dispute letter generator, and re-check simulator.
- `styles.css`: Deep obsidian design tokens, glowing borders, custom scrollbars, animations, and high-fidelity `@media print` rules for court- and dispute-ready PDF exports.
- `start-server.ps1`: Built-in PowerShell HTTP server with zero external dependencies.
- `start.bat`: Windows batch script for immediate 1-click launch.

---

## Consumer Disclaimer
*ClaimKeeper provides cryptographic snapshot timestamping and text comparison for personal consumer reference and dispute documentation. It does not replace formal legal counsel or guarantee merchant dispute outcomes.*
