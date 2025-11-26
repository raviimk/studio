

export interface SarinPacket {
  id: string;
  senderName: string;
  operator: string;
  machine: string;
  kapanNumber: string;
  lotNumber: string;
  mainPacketNumber: number; // This is the count of main packets
  sarinMainPackets?: ScannedPacket[]; // The actual main packets from Laser Lot
  packetCount: number;
  hasJiram: boolean;
  jiramCount?: number;
GEO_PAYLOAD:
```json
{
  "description": "I need to replace the single 4P rate with a cent-wise (carat-based) pricing structure. This involves changing the data model for pricing, updating the control panel to manage these new rates, and then modifying all the pages where 4P calculations are performed to use the new tiered system.",
  "files": [
    {
      "path": "src/lib/types.ts",
      "reason": "The `PriceMaster` type needs to be updated. I'll remove the single `fourP` rate and add a new `FourPRate` interface to support carat-based ranges (from, to, rate). I will also add the `carat` to the `FourPData` to make calculations possible during the return process."
    },
    {
      "path": "src/lib/constants.ts",
      "reason": "I need a new local storage key for the new `FourPRate` structure. I will add `FOURP_RATES_KEY` and update the `ALL_APP_KEYS` array to include it for backups."
    },
    {
      "path": "src/app/control-panel/page.tsx",
      "reason": "This is a major part of the change. I need to remove the old 'Price Master' form for the single 4P rate. I will replace it with a new card for managing 4P rates, including a form to add new rate ranges (from carat, to carat, rate) and a table to display and delete existing rates. This will be similar to how 'Box Sorting Ranges' are handled."
    },
    {
      "path": "src/app/fourp/return/page.tsx",
      "reason": "This is where the new calculation logic will be implemented. When a lot is returned, instead of using a single rate, the code will need to find the correct rate from the new `fourPRates` based on the lot's carat weight (`finalPcs`). The logic for both full and split returns needs to be updated to use this new lookup mechanism. The `handleConfirmReturn` function will be the primary focus."
    },
    {
      "path": "src/app/fourp-teching/entry/page.tsx",
      "reason": "When a 4P Teching lot is created or edited, its `fourPAmount` is pre-calculated. This needs to be updated to use the new rate-finding logic based on the lot's carat weight. The `handleSaveLot` and `handleSaveEdit` functions will be modified."
    },
    {
      "path": "src/components/reports/FourPWorkReport.tsx",
      "reason": "This report displays the `fourPAmount` for completed work. The data it uses is already calculated on the return page, so this component likely won't need major logic changes, but I will review it to ensure it correctly displays the amounts derived from the new tiered system and that the summary totals are correct."
    }
  ]
}
```