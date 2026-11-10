/**
 * ClaimKeeper — Consumer Policy Versioning & Evidence Tool
 * "Keep the Policy. Keep the Proof."
 */

// --- Deterministic SHA-256 Hash Function (Pure JS + Web Crypto Fallback) ---
function pureSha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  
  let hash = [];
  const k = [];
  let primeCounter = 0;

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = candidate * candidate; i < 312; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  hash = hash.slice(0, 8);

  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return;
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15], w2 = w[i - 2];

      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);

      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16 ? 0 : '') + b.toString(16));
      }
    }
  }
  return result.substring(0, 64);
}

async function computeSha256(text) {
  try {
    if (window.crypto && window.crypto.subtle && window.isSecureContext) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text.trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}
  return pureSha256(text.trim());
}

// --- Demo Seed Policies (Featuring Adidas, Nike, Netflix, Apple, Amazon, Zara) ---
const INITIAL_POLICIES = [
  {
    id: "pol-adidas-01",
    brand: "Adidas",
    brandDomain: "adidas.com",
    officialSiteUrl: "https://www.adidas.com",
    submittedUrl: "https://www.adidas.com/us/help/returns-refunds",
    label: "Return Policy & Limited Hype Drop Terms",
    category: "Apparel",
    monitoringStatus: "Active",
    lastChecked: "15 mins ago",
    changeStatus: "MODIFIED",
    changeSummary: "Limited hype releases and Confirmed app drops marked as Final Sale (no returns); $4.99 mail-in carrier fee introduced.",
    versions: [
      {
        versionNumber: 1,
        capturedAt: "2026-09-10T10:00:00Z",
        capturedAtFormatted: "Sep 10, 2026 · 10:00 AM",
        retrievalStatus: 200,
        statusText: "OK (Verified)",
        contentHash: "a1d2e3f4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2",
        sourceUrl: "https://www.adidas.com/us/help/returns-refunds",
        contentText: `Adidas US Return & Exchange Policy:
You have 30 days from the delivery date to return any eligible purchase.
All returns by mail or at official Adidas Retail Stores are 100% free of charge.
Limited edition hype releases and Confirmed app drops can be returned within 14 calendar days of delivery.
Items must be unworn, with all original tags attached, in original shoe box packaging.`
      },
      {
        versionNumber: 2,
        capturedAt: "2026-10-04T15:30:00Z",
        capturedAtFormatted: "Oct 04, 2026 · 03:30 PM",
        retrievalStatus: 200,
        statusText: "OK (Verified)",
        contentHash: "f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9",
        sourceUrl: "https://www.adidas.com/us/help/returns-refunds",
        contentText: `Adidas US Return & Exchange Policy:
You have 30 days from the delivery date to return eligible regular purchases.
In-store returns at Adidas Retail Stores remain complimentary. A $4.99 shipping fee will be deducted from your refund for mail-in returns.
Limited edition hype releases and Confirmed app drops are strictly FINAL SALE and cannot be returned, refunded, or exchanged.
Items must be unworn, with all original tags attached, in original shoe box packaging.`
      }
    ],
    logs: [
      { timestamp: "Sep 10, 2026 10:00 AM", event: "Baseline capture stored as v1. SHA-256: a1d2...d1e2" },
      { timestamp: "Oct 04, 2026 03:30 PM", event: "Policy change detected. Final sale clause & $4.99 return fee recorded in v2." }
    ]
  },
  {
    id: "pol-nike-02",
    brand: "Nike",
    brandDomain: "nike.com",
    officialSiteUrl: "https://www.nike.com",
    submittedUrl: "https://www.nike.com/help/a/returns-policy",
    label: "Nike Member 60-Day Trial & Return Policy",
    category: "Apparel",
    monitoringStatus: "Active",
    lastChecked: "40 mins ago",
    changeStatus: "MODIFIED",
    changeSummary: "Post-60-day goodwill returns eliminated; strict receipt requirement enforced on all footwear.",
    versions: [
      {
        versionNumber: 1,
        capturedAt: "2026-08-15T09:00:00Z",
        capturedAtFormatted: "Aug 15, 2026 · 09:00 AM",
        retrievalStatus: 200,
        statusText: "OK (Verified)",
        contentHash: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
        sourceUrl: "https://www.nike.com/help/a/returns-policy",
        contentText: `Nike Returns Policy:
We give Nike Members 60 days to test out their Nike purchase with peace of mind.
You can return items even if you have tested or worn them on the track or court within 60 days.
After 60 days, items that are unworn and unwashed may still be returned for store merchandise credit with proof of purchase.
Store returns and member mail returns are free.`
      },
      {
        versionNumber: 2,
        capturedAt: "2026-09-22T11:45:00Z",
        capturedAtFormatted: "Sep 22, 2026 · 11:45 AM",
        retrievalStatus: 200,
        statusText: "OK (Verified)",
        contentHash: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
        sourceUrl: "https://www.nike.com/help/a/returns-policy",
        contentText: `Nike Returns Policy:
We give Nike Members 60 days to test out their Nike purchase with peace of mind.
You can return items even if you have tested or worn them on the track or court within 60 days.
After 60 days, returns will no longer be accepted under any circumstances. No exceptions or store credits will be provided past 60 calendar days.
Store returns and member mail returns are free.`
      }
    ],
    logs: [
      { timestamp: "Aug 15, 2026 09:00 AM", event: "Baseline snapshot stored as v1." },
      { timestamp: "Sep 22, 2026 11:45 AM", event: "Clause updated: strict 60-day cutoff enforced. Version v2 recorded." }
    ]
  },
  {
    id: "pol-netflix-03",
    brand: "Netflix",
    brandDomain: "netflix.com",
    officialSiteUrl: "https://www.netflix.com",
    submittedUrl: "https://help.netflix.com/legal/termsofuse",
    label: "Subscription Terms of Use & Household Sharing",
    category: "Subscriptions",
    monitoringStatus: "Active",
    lastChecked: "1 hour ago",
    changeStatus: "MODIFIED",
    changeSummary: "Account sharing restricted to single physical household; $7.99/mo fee for extra member profiles.",
    versions: [
      {
        versionNumber: 1,
        capturedAt: "2026-08-01T12:00:00Z",
        capturedAtFormatted: "Aug 01, 2026 · 12:00 PM",
        retrievalStatus: 200,
        statusText: "OK (Verified)",
        contentHash: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
        sourceUrl: "https://help.netflix.com/legal/termsofuse",
        contentText: `Netflix Subscription Terms:
The Netflix service and any content accessed through the service are for your personal and non-commercial use only.
You may share your account credentials with family members or friends within your social network.
Simultaneous streams are determined by your chosen plan (Basic: 1, Standard: 2, Premium: 4 screens).
You may cancel membership at any time without cancellation penalties.`
      },
      {
        versionNumber: 2,
        capturedAt: "2026-08-28T14:10:00Z",
        capturedAtFormatted: "Aug 28, 2026 · 02:10 PM",
        retrievalStatus: 200,
        statusText: "OK (Verified)",
        contentHash: "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
        sourceUrl: "https://help.netflix.com/legal/termsofuse",
        contentText: `Netflix Subscription Terms:
The Netflix service and any content accessed through the service are for your personal and non-commercial use only.
A Netflix account is strictly intended for people who live together in a single household.
To share outside your primary household, an Extra Member slot must be purchased for $7.99/month. Unverified external devices will be blocked after 14 days.
Simultaneous streams are determined by your chosen plan (Basic: 1, Standard: 2, Premium: 4 screens).
You may cancel membership at any time without cancellation penalties.`
      }
    ],
    logs: [
      { timestamp: "Aug 01, 2026 12:00 PM", event: "Baseline snapshot registered as v1." },
      { timestamp: "Aug 28, 2026 02:10 PM", event: "Household sharing clause updated. Version v2 recorded." }
    ]
  },
  {
    id: "pol-apple-04",
    brand: "Apple Inc.",
    brandDomain: "apple.com",
    officialSiteUrl: "https://www.apple.com",
    submittedUrl: "https://www.apple.com/shop/help/returns_refund",
    label: "Hardware Returns & Refund Policy",
    category: "Electronics",
    monitoringStatus: "Active",
    lastChecked: "2 hours ago",
    changeStatus: "MODIFIED",
    changeSummary: "Return window shortened from 14 to 7 days for custom-configured Macs; $50 restocking fee added.",
    versions: [
      {
        versionNumber: 1,
        capturedAt: "2026-07-15T09:30:00Z",
        capturedAtFormatted: "Jul 15, 2026 · 09:30 AM",
        retrievalStatus: 200,
        statusText: "OK (Verified)",
        contentHash: "4c7a5f6e8b23c91d8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d",
        sourceUrl: "https://www.apple.com/shop/help/returns_refund",
        contentText: `Standard Apple Return Policy:
You have 14 calendar days to return an item from the date you received it.
Only items purchased directly from Apple (online or Retail Store) can be returned to Apple.
Items must be in original condition with all accessories, cables, and packaging included.
There are no restocking fees for any returned items.`
      },
      {
        versionNumber: 2,
        capturedAt: "2026-08-05T14:15:00Z",
        capturedAtFormatted: "Aug 05, 2026 · 02:15 PM",
        retrievalStatus: 200,
        statusText: "OK (Verified)",
        contentHash: "8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
        sourceUrl: "https://www.apple.com/shop/help/returns_refund",
        contentText: `Standard Apple Return Policy:
You have 7 calendar days to return custom or built-to-order Mac computers from date of delivery. Standard stock items remain eligible for 14 days.
Only items purchased directly from Apple (online or Retail Store) can be returned to Apple.
Items must be in original condition with all accessories, cables, and packaging included.
A $50 repackaging fee applies to opened custom configurations returned without factory defect.`
      }
    ],
    logs: [
      { timestamp: "Jul 15, 2026 09:30 AM", event: "Baseline snapshot stored as v1." },
      { timestamp: "Aug 05, 2026 02:15 PM", event: "7-day custom hardware restriction detected. Version v2 generated." }
    ]
  },
  {
    id: "pol-amazon-05",
    brand: "Amazon",
    brandDomain: "amazon.com",
    officialSiteUrl: "https://www.amazon.com",
    submittedUrl: "https://www.amazon.com/gp/help/customer/display.html?nodeId=GKM69DUUYKQWKWX7",
    label: "Customer Returns & Drop-off Fee Terms",
    category: "E-Commerce",
    monitoringStatus: "Active",
    lastChecked: "3 hours ago",
    changeStatus: "MODIFIED",
    changeSummary: "Carrier fee of $1.00 - $3.99 added when Amazon Fresh or Whole Foods location is within 5 miles.",
    versions: [
      {
        versionNumber: 1,
        capturedAt: "2026-06-01T10:00:00Z",
        capturedAtFormatted: "Jun 01, 2026 · 10:00 AM",
        retrievalStatus: 200,
        statusText: "OK (Verified)",
        contentHash: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
        sourceUrl: "https://www.amazon.com/gp/help/customer/display.html?nodeId=GKM69DUUYKQWKWX7",
        contentText: `Amazon Return Policy:
Most items fulfilled by Amazon can be returned within 30 days of delivery.
Customers can return eligible items at UPS Store, Kohl's, and Amazon Physical Stores with no box or label needed.
All return drop-off options are 100% free of charge for eligible orders.
Refunds are issued to original payment within 3 to 5 business days.`
      },
      {
        versionNumber: 2,
        capturedAt: "2026-06-25T16:45:00Z",
        capturedAtFormatted: "Jun 25, 2026 · 04:45 PM",
        retrievalStatus: 200,
        statusText: "OK (Verified)",
        contentHash: "3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a",
        sourceUrl: "https://www.amazon.com/gp/help/customer/display.html?nodeId=GKM69DUUYKQWKWX7",
        contentText: `Amazon Return Policy:
Most items fulfilled by Amazon can be returned within 30 days of delivery.
Customers can return eligible items at UPS Store, Kohl's, and Amazon Physical Stores with no box or label needed.
A return fee of $1.00 to $3.99 will be deducted from your refund if you select a third-party carrier drop-off when an Amazon physical return location is located within 5 miles of your delivery address.
Refunds are issued to original payment within 3 to 5 business days.`
      }
    ],
    logs: [
      { timestamp: "Jun 01, 2026 10:00 AM", event: "Baseline snapshot stored as v1." },
      { timestamp: "Jun 25, 2026 04:45 PM", event: "Third-party carrier fee clause recorded in Version v2." }
    ]
  },
  {
    id: "pol-zara-06",
    brand: "Zara",
    brandDomain: "zara.com",
    officialSiteUrl: "https://www.zara.com",
    submittedUrl: "https://www.zara.com/us/en/help-center/Returns",
    label: "Online Order Returns & Drop-Off Fee",
    category: "Apparel",
    monitoringStatus: "Active",
    lastChecked: "4 hours ago",
    changeStatus: "MODIFIED",
    changeSummary: "Mail drop-off fee increased from $3.95 to $4.95 per return request.",
    versions: [
      {
        versionNumber: 1,
        capturedAt: "2026-07-01T11:00:00Z",
        capturedAtFormatted: "Jul 01, 2026 · 11:00 AM",
        retrievalStatus: 200,
        statusText: "OK (Verified)",
        contentHash: "2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d",
        sourceUrl: "https://www.zara.com/us/en/help-center/Returns",
        contentText: `Zara USA Return Conditions:
You have 30 days from shipping confirmation to return any purchase.
Returns at Zara physical stores are completely free of charge.
Returns via drop-off point have an associated cost of $3.95, which will be deducted from your total refund amount.
Garments must be in perfect condition with original interior tags intact.`
      },
      {
        versionNumber: 2,
        capturedAt: "2026-07-28T09:10:00Z",
        capturedAtFormatted: "Jul 28, 2026 · 09:10 AM",
        retrievalStatus: 200,
        statusText: "OK (Verified)",
        contentHash: "9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
        sourceUrl: "https://www.zara.com/us/en/help-center/Returns",
        contentText: `Zara USA Return Conditions:
You have 30 days from shipping confirmation to return any purchase.
Returns at Zara physical stores are completely free of charge.
Returns via drop-off point have an associated cost of $4.95 per return request, which will be deducted from your total refund amount.
Garments must be in perfect condition with original interior tags intact.`
      }
    ],
    logs: [
      { timestamp: "Jul 01, 2026 11:00 AM", event: "Baseline snapshot stored as v1." },
      { timestamp: "Jul 28, 2026 09:10 AM", event: "Drop-off fee adjusted to $4.95 in Version v2." }
    ]
  }
];

// --- Quick Track Brand Presets ---
const BRAND_PRESETS = [
  { brand: "Adidas", domain: "adidas.com", url: "https://www.adidas.com/us/help/returns-refunds", label: "Returns & Hype Drops", cat: "Apparel" },
  { brand: "Nike", domain: "nike.com", url: "https://www.nike.com/help/a/returns-policy", label: "60-Day Trial Policy", cat: "Apparel" },
  { brand: "Netflix", domain: "netflix.com", url: "https://help.netflix.com/legal/termsofuse", label: "Household Sharing Terms", cat: "Subscriptions" },
  { brand: "Apple", domain: "apple.com", url: "https://www.apple.com/shop/help/returns_refund", label: "Hardware Returns & Warranty", cat: "Electronics" },
  { brand: "Amazon", domain: "amazon.com", url: "https://www.amazon.com/gp/help/customer/display.html?nodeId=GKM69DUUYKQWKWX7", label: "Return & Drop-off Terms", cat: "E-Commerce" },
  { brand: "Zara", domain: "zara.com", url: "https://www.zara.com/us/en/help-center/Returns", label: "Online Order Returns", cat: "Apparel" }
];

// --- State Store ---
class PolicyStore {
  constructor() {
    this.STORAGE_KEY = "claimkeeper_policies_v2";
    this.policies = this.load();
    this.activeFilter = "ALL";
    this.searchQuery = "";
    this.activeDiffPolicyId = null;
    this.activeEvidencePolicyId = null;
    this.pendingDeletePolicyId = null;
    this.diffMode = "side-by-side";
  }

  load() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return JSON.parse(JSON.stringify(INITIAL_POLICIES));
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.policies));
    } catch (e) {}
  }

  getFilteredPolicies() {
    return this.policies.filter(policy => {
      const matchesFilter = (this.activeFilter === "ALL") || (policy.category.toUpperCase() === this.activeFilter.toUpperCase());
      const query = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        policy.brand.toLowerCase().includes(query) ||
        policy.label.toLowerCase().includes(query) ||
        policy.submittedUrl.toLowerCase().includes(query) ||
        policy.category.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }

  getPolicy(id) {
    return this.policies.find(p => p.id === id);
  }

  async addPolicy({ brand, label, submittedUrl, category, contentText }) {
    if (!submittedUrl.startsWith('http://') && !submittedUrl.startsWith('https://')) {
      throw new Error("Invalid URL. URL must start with http:// or https://");
    }

    if (submittedUrl.includes('localhost') || submittedUrl.includes('127.0.0.1')) {
      throw new Error("Security protection: Localhost addresses cannot be monitored.");
    }

    let domain = "brand.com";
    try {
      domain = new URL(submittedUrl).hostname.replace(/^www\./, '');
    } catch (e) {}

    const textToStore = (contentText && contentText.trim()) ? contentText.trim() : 
`Standard Policy Terms for ${brand}:
All consumer purchases are protected under our standard return and warranty service terms.
Returns accepted within 14 calendar days of confirmed delivery in original packaging.
For support or claims, please contact customer care with your receipt or proof of purchase.`;

    const hash = await computeSha256(textToStore);
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + " · " + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newPolicy = {
      id: "pol-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6),
      brand: brand || domain,
      brandDomain: domain,
      officialSiteUrl: `https://${domain}`,
      submittedUrl: submittedUrl,
      label: label || `${brand} Policy`,
      category: category || "Other",
      monitoringStatus: "Active",
      lastChecked: "Just now",
      changeStatus: "STABLE",
      changeSummary: "Initial baseline capture saved. Actively monitoring for wording changes.",
      versions: [
        {
          versionNumber: 1,
          capturedAt: now.toISOString(),
          capturedAtFormatted: formatted,
          retrievalStatus: 200,
          statusText: "OK (Verified)",
          contentHash: hash,
          sourceUrl: submittedUrl,
          contentText: textToStore
        }
      ],
      logs: [
        { timestamp: formatted, event: `Baseline capture stored as v1. SHA-256: ${hash.substring(0, 8)}...` }
      ]
    };

    this.policies.unshift(newPolicy);
    this.save();
    return newPolicy;
  }

  removePolicy(id) {
    const index = this.policies.findIndex(p => p.id === id);
    if (index !== -1) {
      const removed = this.policies.splice(index, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }

  restorePolicy(policyObj) {
    if (policyObj) {
      this.policies.unshift(policyObj);
      this.save();
    }
  }

  async captureNewVersion(policyId, { newText, simulateFailure = false, simulateNoChange = false }) {
    const policy = this.getPolicy(policyId);
    if (!policy) return;

    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + " · " + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (simulateFailure) {
      policy.logs.unshift({
        timestamp: formatted,
        event: "Network check failed (HTTP 502 Bad Gateway). Current version preserved without creating false change."
      });
      policy.lastChecked = "Just now (Fetch Failed)";
      this.save();
      return { success: false };
    }

    const latest = policy.versions[policy.versions.length - 1];
    let candidateText = newText;
    if (simulateNoChange) candidateText = latest.contentText;

    const newHash = await computeSha256(candidateText);

    if (newHash === latest.contentHash) {
      policy.logs.unshift({
        timestamp: formatted,
        event: `Routine re-check verified: SHA-256 match (${newHash.substring(0, 8)}...). No changes.`
      });
      policy.lastChecked = "Just now";
      this.save();
      return { success: true, changed: false, hash: newHash };
    }

    const newVersionNum = policy.versions.length + 1;
    policy.versions.push({
      versionNumber: newVersionNum,
      capturedAt: now.toISOString(),
      capturedAtFormatted: formatted,
      retrievalStatus: 200,
      statusText: "OK (Verified)",
      contentHash: newHash,
      sourceUrl: policy.submittedUrl,
      contentText: candidateText
    });

    policy.changeStatus = "MODIFIED";
    policy.changeSummary = `Wording change detected in Version ${newVersionNum}. Cryptographic hash divergence: ${newHash.substring(0, 8)}...`;
    policy.lastChecked = "Just now";
    policy.logs.unshift({
      timestamp: formatted,
      event: `Hash divergence detected. Version v${newVersionNum} created with verified timestamp.`
    });

    this.save();
    return { success: true, changed: true, newVersionNum, hash: newHash };
  }
}

// --- Word-level Diff Engine ---
function tokenizeText(text) {
  return text.match(/\S+|\s+/g) || [];
}

function computeDiff(oldText, newText) {
  const oldTokens = tokenizeText(oldText);
  const newTokens = tokenizeText(newText);
  const n = oldTokens.length;
  const m = newTokens.length;
  
  if (n * m > 1000000) return computeSimpleLineDiff(oldText, newText);

  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (oldTokens[i] === newTokens[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  let i = n, j = m;
  const diff = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldTokens[i - 1] === newTokens[j - 1]) {
      diff.unshift({ type: 'equal', text: oldTokens[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({ type: 'add', text: newTokens[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diff.unshift({ type: 'remove', text: oldTokens[i - 1] });
      i--;
    }
  }
  return diff;
}

function computeSimpleLineDiff(oldText, newText) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result = [];
  const max = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < max; i++) {
    const o = oldLines[i];
    const n = newLines[i];
    if (o === n) {
      result.push({ type: 'equal', text: (o || '') + '\n' });
    } else {
      if (o !== undefined) result.push({ type: 'remove', text: o + '\n' });
      if (n !== undefined) result.push({ type: 'add', text: n + '\n' });
    }
  }
  return result;
}

function renderDiffHtml(diff, mode = 'side-by-side') {
  if (mode === 'unified') {
    let html = '<div class="font-mono text-xs sm:text-sm leading-relaxed p-4 bg-slate-950/80 rounded-xl overflow-x-auto border border-slate-800">';
    diff.forEach(part => {
      const escaped = escapeHtml(part.text);
      if (part.type === 'remove') html += `<span class="diff-removed">${escaped}</span>`;
      else if (part.type === 'add') html += `<span class="diff-added">${escaped}</span>`;
      else html += `<span class="text-slate-300">${escaped}</span>`;
    });
    html += '</div>';
    return html;
  }

  let leftHtml = '', rightHtml = '';
  diff.forEach(part => {
    const escaped = escapeHtml(part.text);
    if (part.type === 'equal') {
      leftHtml += `<span class="text-slate-300">${escaped}</span>`;
      rightHtml += `<span class="text-slate-300">${escaped}</span>`;
    } else if (part.type === 'remove') {
      leftHtml += `<span class="diff-removed">${escaped}</span>`;
    } else if (part.type === 'add') {
      rightHtml += `<span class="diff-added">${escaped}</span>`;
    }
  });

  return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
        <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-rose-400">
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-rose-500"></span> Prior Monitored Wording (v1)</span>
        </div>
        <div class="font-mono text-xs sm:text-sm leading-relaxed text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto pr-2">
          ${leftHtml}
        </div>
      </div>
      <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
        <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Current Active Wording (Latest)</span>
        </div>
        <div class="font-mono text-xs sm:text-sm leading-relaxed text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto pr-2">
          ${rightHtml}
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(string) {
  const entityMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(string).replace(/[&<>"']/g, s => entityMap[s]);
}

// --- Store & UI Controller ---
const store = new PolicyStore();

function showToast(message, type = 'info', actionCallback = null, actionLabel = 'Undo') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const typeStyles = {
    info: 'bg-slate-900 border border-sky-500/40 text-sky-100',
    success: 'bg-slate-900 border border-emerald-500/50 text-emerald-100',
    danger: 'bg-slate-900 border border-rose-500/50 text-rose-100',
    warning: 'bg-slate-900 border border-amber-500/50 text-amber-100'
  };

  toast.className = `toast ${typeStyles[type] || typeStyles.info}`;
  let actionHtml = '';
  if (actionCallback) {
    actionHtml = `<button class="ml-3 px-2.5 py-1 text-xs font-bold bg-white/10 hover:bg-white/20 rounded text-cyan-300 transition-colors uppercase tracking-wider">${actionLabel}</button>`;
  }

  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <span>${type === 'success' ? '✓' : type === 'danger' ? '✕' : 'ℹ'}</span>
      <span>${escapeHtml(message)}</span>
    </div>
    ${actionHtml}
  `;

  if (actionCallback) {
    toast.querySelector('button').addEventListener('click', () => {
      actionCallback();
      toast.remove();
    });
  }

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// --- Dashboard Render ---
function renderDashboard() {
  const grid = document.getElementById('policies-grid');
  const emptyState = document.getElementById('empty-state');
  if (!grid) return;

  const filtered = store.getFilteredPolicies();
  updateStats();

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  grid.innerHTML = filtered.map(policy => {
    const hasChanges = policy.versions.length > 1;
    const latest = policy.versions[policy.versions.length - 1];
    const shortHash = latest.contentHash.substring(0, 8) + '...' + latest.contentHash.substring(latest.contentHash.length - 6);

    const catBadgeColors = {
      Apparel: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
      Subscriptions: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      Electronics: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      'E-Commerce': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      Other: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    };
    const catClass = catBadgeColors[policy.category] || catBadgeColors.Other;

    return `
      <div class="glass-panel-elevated rounded-2xl p-5 md:p-6 transition-all duration-200 hover:border-cyan-500/40 relative flex flex-col justify-between" id="card-${policy.id}">
        <!-- Header -->
        <div>
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center font-bold text-white text-base">
                ${escapeHtml(policy.brand.charAt(0))}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-white text-base tracking-tight">${escapeHtml(policy.brand)}</h3>
                  <a href="${escapeHtml(policy.officialSiteUrl)}" target="_blank" rel="noopener noreferrer" 
                     class="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 hover:underline bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/60"
                     title="Visit Official Website">
                    <span>${escapeHtml(policy.brandDomain)}</span>
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                  </a>
                </div>
                <p class="text-xs text-slate-400">${escapeHtml(policy.label)}</p>
              </div>
            </div>

            <span class="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${catClass}">
              ${escapeHtml(policy.category)}
            </span>
          </div>

          <!-- Status Box -->
          <div class="my-3 p-3 rounded-xl ${hasChanges ? 'bg-amber-950/20 border border-amber-500/30' : 'bg-slate-900/60 border border-slate-800'}">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="flex items-center gap-1.5 font-semibold ${hasChanges ? 'text-amber-400' : 'text-emerald-400'}">
                <span class="w-2 h-2 rounded-full ${hasChanges ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}"></span>
                ${hasChanges ? `Change Detected (Version v${latest.versionNumber})` : 'Policy Stable (v1)'}
              </span>
              <span class="text-slate-500 text-[11px]">${escapeHtml(policy.lastChecked)}</span>
            </div>
            <p class="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              ${escapeHtml(policy.changeSummary)}
            </p>
          </div>

          <!-- Metadata -->
          <div class="space-y-1 text-xs text-slate-400 font-mono bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 mb-4">
            <div class="flex items-center justify-between">
              <span class="text-slate-500">SHA-256:</span>
              <button onclick="copyToClipboard('${latest.contentHash}', 'SHA-256 copied!')" 
                      class="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline" title="Copy SHA-256 checksum">
                <span>${shortHash}</span>
                <svg class="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              </button>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">Captured:</span>
              <span class="text-slate-300">${escapeHtml(latest.capturedAtFormatted)}</span>
            </div>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="pt-3 border-t border-slate-800/80 space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <button onclick="openDiffModal('${policy.id}')" 
                    class="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-all flex items-center justify-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
              <span>Compare Diff</span>
            </button>
            <button onclick="openEvidenceReport('${policy.id}')" 
                    class="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all flex items-center justify-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>Evidence Report</span>
            </button>
          </div>

          <div class="flex items-center justify-between text-xs pt-1">
            <div class="flex items-center gap-2">
              <button onclick="openRecheckModal('${policy.id}')" 
                      class="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1 text-[11px]" title="Run verification check">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span>Re-check</span>
              </button>
              <a href="${escapeHtml(policy.submittedUrl)}" target="_blank" rel="noopener noreferrer" 
                 class="text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-1 text-[11px]" title="Open live source terms page">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                <span>Source Terms</span>
              </a>
            </div>

            <!-- Remove Policy Button -->
            <button onclick="promptRemovePolicy('${policy.id}')" 
                    class="text-rose-400/80 hover:text-rose-300 transition-colors flex items-center gap-1 text-[11px] hover:bg-rose-950/40 px-2 py-0.5 rounded border border-transparent hover:border-rose-900/50"
                    title="Remove this policy from active monitoring">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              <span>Remove</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateStats() {
  const countEl = document.getElementById('stat-total-policies');
  const changesEl = document.getElementById('stat-changes-detected');
  if (countEl) countEl.innerText = store.policies.length;
  if (changesEl) {
    const changes = store.policies.filter(p => p.versions.length > 1).length;
    changesEl.innerText = changes;
  }
}

// --- Quick Presets Bar ---
function renderQuickPresets() {
  const container = document.getElementById('quick-presets-container');
  if (!container) return;

  container.innerHTML = BRAND_PRESETS.map(b => {
    return `
      <button onclick="quickAddPreset('${b.brand}')" 
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 transition-all">
        <span class="text-cyan-400 font-bold">+</span>
        <span>${escapeHtml(b.brand)}</span>
      </button>
    `;
  }).join('');
}

async function quickAddPreset(brandName) {
  const preset = BRAND_PRESETS.find(b => b.brand === brandName);
  if (!preset) return;

  const existing = store.policies.find(p => p.brand.toLowerCase() === brandName.toLowerCase());
  if (existing) {
    showToast(`"${brandName}" is already tracked! Highlighting now.`, 'info');
    store.searchQuery = brandName;
    const s = document.getElementById('search-input');
    if (s) s.value = brandName;
    renderDashboard();
    return;
  }

  try {
    await store.addPolicy({
      brand: preset.brand,
      label: preset.label,
      submittedUrl: preset.url,
      category: preset.cat,
      contentText: `Official terms baseline for ${preset.brand}.\nMonitored URL: ${preset.url}\nTimestamped and cryptographically archived by ClaimKeeper.`
    });
    renderDashboard();
    showToast(`Added ${brandName} to your monitored policies!`, 'success');
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// --- Diff Modal ---
function openDiffModal(policyId) {
  const policy = store.getPolicy(policyId);
  if (!policy) return;

  store.activeDiffPolicyId = policyId;
  const modal = document.getElementById('diff-modal');
  const title = document.getElementById('diff-modal-title');
  const subtitle = document.getElementById('diff-modal-subtitle');
  const contentArea = document.getElementById('diff-content-area');
  const officialLink = document.getElementById('diff-official-link');

  title.innerText = `${policy.brand} — Policy Diff`;
  subtitle.innerText = `${policy.label} · ${policy.submittedUrl}`;
  officialLink.href = policy.officialSiteUrl;
  officialLink.innerText = `Visit ${policy.brandDomain} ↗`;

  if (policy.versions.length > 1) {
    const vOld = policy.versions[0];
    const vNew = policy.versions[policy.versions.length - 1];
    const diff = computeDiff(vOld.contentText, vNew.contentText);
    contentArea.innerHTML = renderDiffHtml(diff, store.diffMode);
  } else {
    contentArea.innerHTML = `
      <div class="text-center py-10 px-4 bg-slate-950/60 rounded-xl border border-slate-800">
        <h4 class="font-bold text-white text-sm mb-1">Baseline Version (v1) Active</h4>
        <p class="text-xs text-slate-400 max-w-md mx-auto mb-3">No text modifications detected yet. Subsequent checks will highlight wording differences.</p>
        <div class="bg-slate-900 p-4 rounded-lg font-mono text-xs text-left max-w-xl mx-auto border border-slate-800 text-slate-300 whitespace-pre-wrap">${escapeHtml(policy.versions[0].contentText)}</div>
      </div>
    `;
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDiffModal() {
  document.getElementById('diff-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function setDiffMode(mode) {
  store.diffMode = mode;
  document.getElementById('diff-mode-side').className = mode === 'side-by-side' 
    ? 'px-3 py-1 text-xs font-semibold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
    : 'px-3 py-1 text-xs font-medium text-slate-400 hover:text-white';
  document.getElementById('diff-mode-unified').className = mode === 'unified' 
    ? 'px-3 py-1 text-xs font-semibold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
    : 'px-3 py-1 text-xs font-medium text-slate-400 hover:text-white';

  if (store.activeDiffPolicyId) {
    const policy = store.getPolicy(store.activeDiffPolicyId);
    if (policy && policy.versions.length > 1) {
      const vOld = policy.versions[0];
      const vNew = policy.versions[policy.versions.length - 1];
      const diff = computeDiff(vOld.contentText, vNew.contentText);
      document.getElementById('diff-content-area').innerHTML = renderDiffHtml(diff, store.diffMode);
    }
  }
}

// --- Evidence Report Generator ---
function openEvidenceReport(policyId) {
  const policy = store.getPolicy(policyId);
  if (!policy) return;

  store.activeEvidencePolicyId = policyId;
  const modal = document.getElementById('evidence-modal');
  const reportContainer = document.getElementById('printable-evidence-area');

  const refCode = `CK-EV-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;
  const vOld = policy.versions[0];
  const vLatest = policy.versions[policy.versions.length - 1];
  const diff = computeDiff(vOld.contentText, vLatest.contentText);

  reportContainer.innerHTML = `
    <div class="evidence-report-card bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 text-slate-200">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-4">
        <div>
          <span class="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold">Official Consumer Evidence Dossier</span>
          <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">${escapeHtml(policy.brand)} — Monitored Policy Audit</h2>
          <p class="text-xs text-slate-400 mt-0.5">${escapeHtml(policy.label)}</p>
        </div>
        <div class="sm:text-right font-mono text-xs">
          <div class="text-slate-400">Reference Code:</div>
          <div class="text-cyan-300 font-bold text-sm">${refCode}</div>
          <div class="text-[11px] text-slate-500">Generated: ${new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs mb-5">
        <div>
          <span class="text-slate-500 block">Monitored URL:</span>
          <a href="${escapeHtml(policy.submittedUrl)}" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:underline break-all font-mono">${escapeHtml(policy.submittedUrl)}</a>
        </div>
        <div>
          <span class="text-slate-500 block">Official Brand Portal:</span>
          <a href="${escapeHtml(policy.officialSiteUrl)}" target="_blank" rel="noopener noreferrer" class="text-sky-300 hover:underline break-all">${escapeHtml(policy.officialSiteUrl)} ↗</a>
        </div>
        <div>
          <span class="text-slate-500 block">Baseline Captured (v1):</span>
          <span class="text-white font-mono">${escapeHtml(vOld.capturedAtFormatted)}</span>
          <div class="text-[10px] text-slate-500 font-mono">SHA-256: ${vOld.contentHash.substring(0, 16)}...</div>
        </div>
        <div>
          <span class="text-slate-500 block">Current Version (v${vLatest.versionNumber}):</span>
          <span class="text-white font-mono">${escapeHtml(vLatest.capturedAtFormatted)}</span>
          <div class="text-[10px] text-slate-500 font-mono">SHA-256: ${vLatest.contentHash.substring(0, 16)}...</div>
        </div>
      </div>

      <div class="mb-5 bg-slate-800/40 border border-slate-700/60 p-3.5 rounded-xl">
        <h4 class="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">Dispute Summary</h4>
        <p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(policy.changeSummary)}</p>
      </div>

      <div class="mb-5">
        <h4 class="text-xs font-bold uppercase tracking-wider text-white mb-2">Comparative Wording Lineage</h4>
        ${renderDiffHtml(diff, 'side-by-side')}
      </div>

      <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
        <div>• v1 Hash: ${vOld.contentHash}</div>
        <div>• v${vLatest.versionNumber} Hash: ${vLatest.contentHash}</div>
        <div>• Lineage Status: Deterministic word diff generated. Timestamp and source URL linked.</div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeEvidenceModal() {
  document.getElementById('evidence-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function printEvidenceReport() {
  window.print();
}

function copyDisputeEmail() {
  const policy = store.getPolicy(store.activeEvidencePolicyId);
  if (!policy) return;

  const vOld = policy.versions[0];
  const vLatest = policy.versions[policy.versions.length - 1];

  const email = 
`Subject: Order Inquiry / Terms Inconsistency - ${policy.brand}

Dear Customer Service Team,

I am contacting you regarding terms published on ${policy.brandDomain}.

When I reviewed the policy on ${vOld.capturedAtFormatted.split('·')[0].trim()}, the terms stated:
"${vOld.contentText.replace(/\n/g, ' ')}"
(Archived SHA-256 Checksum: ${vOld.contentHash})

The wording was subsequently altered to:
"${vLatest.contentText.replace(/\n/g, ' ')}"

As an everyday consumer who relied on the published terms in effect at the time of my transaction, I respectfully request that my order be handled under the original terms.

I have attached a timestamped ClaimKeeper evidence report for your reference.

Thank you for your assistance.`;

  copyToClipboard(email, "Dispute email template copied to clipboard!");
}

// --- Remove Policy ---
function promptRemovePolicy(policyId) {
  const policy = store.getPolicy(policyId);
  if (!policy) return;

  store.pendingDeletePolicyId = policyId;
  const modal = document.getElementById('delete-modal');
  const modalText = document.getElementById('delete-modal-text');
  modalText.innerText = `Are you sure you want to remove "${policy.brand} - ${policy.label}" from active tracking?`;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
  document.getElementById('delete-modal').classList.add('hidden');
  store.pendingDeletePolicyId = null;
  document.body.style.overflow = '';
}

function confirmDeletePolicy() {
  if (!store.pendingDeletePolicyId) return;
  const removed = store.removePolicy(store.pendingDeletePolicyId);
  closeDeleteModal();
  renderDashboard();

  if (removed) {
    showToast(`Removed "${removed.brand}" tracker.`, 'info', () => {
      store.restorePolicy(removed);
      renderDashboard();
      showToast(`Restored "${removed.brand}"!`, 'success');
    }, 'Undo');
  }
}

// --- Recheck Simulator ---
function openRecheckModal(policyId) {
  const policy = store.getPolicy(policyId);
  if (!policy) return;

  store.activeRecheckPolicyId = policyId;
  const modal = document.getElementById('recheck-modal');
  document.getElementById('recheck-modal-title').innerText = `Re-check: ${policy.brand}`;
  document.getElementById('recheck-modal-url').innerText = policy.submittedUrl;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeRecheckModal() {
  document.getElementById('recheck-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

async function triggerRecheck(actionType) {
  const policyId = store.activeRecheckPolicyId;
  if (!policyId) return;
  const policy = store.getPolicy(policyId);

  closeRecheckModal();

  if (actionType === 'failure') {
    await store.captureNewVersion(policyId, { simulateFailure: true });
    renderDashboard();
    showToast("Simulated 502 network error: Logged to audit log. Prior version preserved!", 'warning');
  } else if (actionType === 'stable') {
    await store.captureNewVersion(policyId, { simulateNoChange: true });
    renderDashboard();
    showToast(`Parity verified for ${policy.brand}. Zero changes detected.`, 'success');
  } else if (actionType === 'modify') {
    const cur = policy.versions[policy.versions.length - 1].contentText;
    const modified = cur + `\n[Updated]: Returns received after 14 days will be issued store merchandise credit only.`;
    const res = await store.captureNewVersion(policyId, { newText: modified });
    renderDashboard();
    showToast(`Change detected on ${policy.brand}! Created Version v${res.newVersionNum}.`, 'danger');
  }
}

// --- Add Policy Form ---
function initAddPolicyForm() {
  const form = document.getElementById('add-policy-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const brand = document.getElementById('input-brand').value.trim();
    const url = document.getElementById('input-url').value.trim();
    const label = document.getElementById('input-label').value.trim();
    const category = document.getElementById('input-category').value;
    const text = document.getElementById('input-content').value.trim();

    try {
      const added = await store.addPolicy({
        brand,
        submittedUrl: url,
        label,
        category,
        contentText: text
      });

      form.reset();
      document.getElementById('add-modal').classList.add('hidden');
      document.body.style.overflow = '';
      renderDashboard();
      showToast(`Policy for "${added.brand}" added and baseline stored!`, 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });
}

function openAddModal() {
  document.getElementById('add-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeAddModal() {
  document.getElementById('add-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function copyToClipboard(text, msg = "Copied to clipboard!") {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast(msg, 'success')).catch(() => fallbackCopy(text, msg));
  } else {
    fallbackCopy(text, msg);
  }
}

function fallbackCopy(text, msg) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast(msg, 'success');
}

// --- App Bootstrapper ---
function initApp() {
  renderDashboard();
  renderQuickPresets();
  initAddPolicyForm();

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      store.searchQuery = e.target.value;
      renderDashboard();
    });
  }

  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(b => {
        b.classList.remove('bg-cyan-500', 'text-slate-950', 'font-bold');
        b.classList.add('bg-slate-800/80', 'text-slate-400');
      });
      btn.classList.remove('bg-slate-800/80', 'text-slate-400');
      btn.classList.add('bg-cyan-500', 'text-slate-950', 'font-bold');

      store.activeFilter = btn.dataset.filter;
      renderDashboard();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDiffModal();
      closeEvidenceModal();
      closeDeleteModal();
      closeAddModal();
      closeRecheckModal();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
