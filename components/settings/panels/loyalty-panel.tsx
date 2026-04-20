"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsSection, SettingsSwitchRow } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import type { LocationSettings } from "@/types/location-settings/type";
import {
  LOYALTY_AWARD_TYPE_OPTIONS,
  STAFF_POINTS_RECIPIENT_OPTIONS,
} from "@/types/location-settings/type";

const KEYS = [
  "enableLoyaltyProgram",
  "customerLoyaltyAwardType",
  "customerLoyaltyPointsPerOrder",
  "customerLoyaltyPointsPerValue",
  "customerLoyaltyValueThreshold",
  "customerLoyaltyMinimumRedeemablePoints",
  "enableStaffPoints",
  "staffPointsAwardType",
  "staffPointsPerOrder",
  "staffPointsPerValue",
  "staffPointsValueThreshold",
  "staffMinimumRedeemablePoints",
  "staffPointsRecipient",
  "enablePointExpiration",
  "pointExpirationDays",
] as const;

export function LoyaltyRewardsPanel({
  settings,
  onSaved,
}: {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}) {
  const p = useSettingsPanel(KEYS, settings, onSaved);
  const v = p.values;

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Customer loyalty"
        description="Reward returning customers. Points are per-location."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Enable loyalty program"
          checked={!!v.enableLoyaltyProgram}
          onChange={(x) => p.setField("enableLoyaltyProgram", x)}
          disabled={p.isPending}
        />
        {v.enableLoyaltyProgram && (
          <>
            <Field label="Award type">
              <Select
                value={v.customerLoyaltyAwardType ?? "PER_ORDER"}
                onValueChange={(val) =>
                  p.setField(
                    "customerLoyaltyAwardType",
                    val as LocationSettings["customerLoyaltyAwardType"],
                  )
                }
                disabled={p.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOYALTY_AWARD_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {v.customerLoyaltyAwardType === "PER_ORDER" ? (
                <Field label="Points per order">
                  <Input
                    type="number"
                    min={1}
                    value={v.customerLoyaltyPointsPerOrder ?? ""}
                    onChange={(e) =>
                      p.setField(
                        "customerLoyaltyPointsPerOrder",
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                    disabled={p.isPending}
                  />
                </Field>
              ) : (
                <>
                  <Field label="Points per threshold">
                    <Input
                      type="number"
                      min={1}
                      value={v.customerLoyaltyPointsPerValue ?? ""}
                      onChange={(e) =>
                        p.setField(
                          "customerLoyaltyPointsPerValue",
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      disabled={p.isPending}
                    />
                  </Field>
                  <Field label="Value threshold">
                    <Input
                      type="number"
                      min={1}
                      value={v.customerLoyaltyValueThreshold ?? ""}
                      onChange={(e) =>
                        p.setField(
                          "customerLoyaltyValueThreshold",
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      disabled={p.isPending}
                    />
                  </Field>
                </>
              )}
              <Field label="Minimum redeemable points">
                <Input
                  type="number"
                  min={0}
                  value={v.customerLoyaltyMinimumRedeemablePoints ?? ""}
                  onChange={(e) =>
                    p.setField(
                      "customerLoyaltyMinimumRedeemablePoints",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  disabled={p.isPending}
                />
              </Field>
            </div>
          </>
        )}
      </SettingsSection>

      <SettingsSection
        title="Staff points"
        description="Reward staff for closing orders. Separate wallet from customer loyalty."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Enable staff points"
          checked={!!v.enableStaffPoints}
          onChange={(x) => p.setField("enableStaffPoints", x)}
          disabled={p.isPending}
        />
        {v.enableStaffPoints && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Award type">
                <Select
                  value={v.staffPointsAwardType ?? "PER_ORDER"}
                  onValueChange={(val) =>
                    p.setField(
                      "staffPointsAwardType",
                      val as LocationSettings["staffPointsAwardType"],
                    )
                  }
                  disabled={p.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOYALTY_AWARD_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Recipient">
                <Select
                  value={v.staffPointsRecipient ?? "FINISHED_BY"}
                  onValueChange={(val) =>
                    p.setField(
                      "staffPointsRecipient",
                      val as LocationSettings["staffPointsRecipient"],
                    )
                  }
                  disabled={p.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_POINTS_RECIPIENT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {v.staffPointsAwardType === "PER_ORDER" ? (
                <Field label="Points per order">
                  <Input
                    type="number"
                    min={1}
                    value={v.staffPointsPerOrder ?? ""}
                    onChange={(e) =>
                      p.setField(
                        "staffPointsPerOrder",
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                    disabled={p.isPending}
                  />
                </Field>
              ) : (
                <>
                  <Field label="Points per threshold">
                    <Input
                      type="number"
                      min={1}
                      value={v.staffPointsPerValue ?? ""}
                      onChange={(e) =>
                        p.setField(
                          "staffPointsPerValue",
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      disabled={p.isPending}
                    />
                  </Field>
                  <Field label="Value threshold">
                    <Input
                      type="number"
                      min={1}
                      value={v.staffPointsValueThreshold ?? ""}
                      onChange={(e) =>
                        p.setField(
                          "staffPointsValueThreshold",
                          e.target.value === "" ? null : Number(e.target.value),
                        )
                      }
                      disabled={p.isPending}
                    />
                  </Field>
                </>
              )}
              <Field label="Minimum redeemable points">
                <Input
                  type="number"
                  min={0}
                  value={v.staffMinimumRedeemablePoints ?? ""}
                  onChange={(e) =>
                    p.setField(
                      "staffMinimumRedeemablePoints",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  disabled={p.isPending}
                />
              </Field>
            </div>
          </>
        )}
      </SettingsSection>

      <SettingsSection
        title="Point expiration"
        description="Applies to both customer and staff points."
        onSave={p.save}
        isPending={p.isPending}
        isDirty={p.isDirty}
      >
        <SettingsSwitchRow
          label="Expire unused points"
          checked={!!v.enablePointExpiration}
          onChange={(x) => p.setField("enablePointExpiration", x)}
          disabled={p.isPending}
        />
        {v.enablePointExpiration && (
          <Field label="Expire after (days)">
            <Input
              type="number"
              min={1}
              max={3650}
              value={v.pointExpirationDays ?? ""}
              onChange={(e) =>
                p.setField(
                  "pointExpirationDays",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              disabled={p.isPending}
            />
          </Field>
        )}
      </SettingsSection>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}
