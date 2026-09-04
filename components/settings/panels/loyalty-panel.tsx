"use client";

import { Award, CalendarClock, Coins, Star, UserCircle, Users } from "lucide-react";

import {
  ControlInput,
  RadioCards,
  SegmentedRadio,
  StandaloneField as Field,
  ToggleRow,
  standaloneLabelClass,
} from "@/components/ui/field";
import { SettingsSection, parseOptionalNumber } from "../shared/settings-section";
import { useSettingsPanel } from "../shared/use-settings-panel";
import { PanelHeader } from "../shared/panel-header";
import { SettingsSaveBar } from "../shared/settings-save-bar";
import type { LocationSettings } from "@/types/location-settings/type";
import {
  LOYALTY_AWARD_TYPE_OPTIONS,
  STAFF_POINTS_RECIPIENT_OPTIONS,
} from "@/types/location-settings/type";

const KEYS = [
  "enableCustomerAccounts",
  "enableCustomerReviews",
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

const ICON = "h-3.5 w-3.5";

const RECIPIENT_CARDS = STAFF_POINTS_RECIPIENT_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
  description:
    o.value === "FINISHED_BY"
      ? "The person who settled and closed the order takes the points."
      : o.value === "ASSIGNED_TO"
        ? "The waiter or agent the order was assigned to takes the points."
        : "Points are shared between the assigned and the closing staff.",
}));

/** Right-hand unit on points inputs, so a bare number never reads ambiguously. */
const PTS = "pts";

export function LoyaltyRewardsPanel({
  settings,
  onSaved,
}: {
  settings: LocationSettings;
  onSaved: (next: LocationSettings) => void;
}) {
  const p = useSettingsPanel(KEYS, settings, onSaved);
  const v = p.values;
  const d = p.isPending;
  const currency = settings.currency || undefined;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Customers & loyalty"
        description="Customer accounts, reviews, and how points are awarded and redeemed."
      />

      <SettingsSection
        icon={<UserCircle className="h-4 w-4" />}
        title="Customer accounts & reviews"
        description="Self-service sign-in, order tracking, and post-order reviews."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Customer accounts"
            hint="Customers can register, save addresses and track orders."
            checked={!!v.enableCustomerAccounts}
            onChange={(x) => p.setField("enableCustomerAccounts", x)}
            disabled={d}
          />
          <ToggleRow
            label="Customer reviews"
            hint="Collect ratings and comments after each order."
            checked={!!v.enableCustomerReviews}
            onChange={(x) => p.setField("enableCustomerReviews", x)}
            disabled={d}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<Star className="h-4 w-4" />}
        title="Customer loyalty"
        description="Reward returning customers. Points are held per location."
      >
        <ToggleRow
          label="Loyalty program"
          hint="Award points on qualifying orders and let customers redeem them."
          checked={!!v.enableLoyaltyProgram}
          onChange={(x) => p.setField("enableLoyaltyProgram", x)}
          disabled={d}
        />

        {v.enableLoyaltyProgram && (
          <div className="space-y-3.5 border-t border-dashed border-line pt-4">
            <div className="space-y-[7px]">
              <span className={standaloneLabelClass}>How points are earned</span>
              <SegmentedRadio
                value={v.customerLoyaltyAwardType ?? "PER_ORDER"}
                onChange={(val) =>
                  p.setField(
                    "customerLoyaltyAwardType",
                    val as LocationSettings["customerLoyaltyAwardType"],
                  )
                }
                options={LOYALTY_AWARD_TYPE_OPTIONS}
                disabled={d}
              />
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {v.customerLoyaltyAwardType === "PER_ORDER" ? (
                <Field label="Points per order" hint="Awarded once per qualifying order.">
                  {(id) => (
                    <ControlInput
                      id={id}
                      type="number"
                      inputMode="numeric"
                      mono
                      min={1}
                      suffix={PTS}
                      prefix={<Award className={ICON} />}
                      value={v.customerLoyaltyPointsPerOrder ?? ""}
                      onChange={(e) =>
                        p.setField(
                          "customerLoyaltyPointsPerOrder",
                          parseOptionalNumber(e.target.value),
                        )
                      }
                      placeholder="1"
                      disabled={d}
                    />
                  )}
                </Field>
              ) : (
                <>
                  <Field label="Points awarded" hint="Per threshold reached below.">
                    {(id) => (
                      <ControlInput
                        id={id}
                        type="number"
                        inputMode="numeric"
                        mono
                        min={1}
                        suffix={PTS}
                        prefix={<Award className={ICON} />}
                        value={v.customerLoyaltyPointsPerValue ?? ""}
                        onChange={(e) =>
                          p.setField(
                            "customerLoyaltyPointsPerValue",
                            parseOptionalNumber(e.target.value),
                          )
                        }
                        placeholder="1"
                        disabled={d}
                      />
                    )}
                  </Field>
                  <Field label="Value threshold" hint="Order value that earns those points.">
                    {(id) => (
                      <ControlInput
                        id={id}
                        type="number"
                        inputMode="decimal"
                        mono
                        min={1}
                        suffix={currency}
                        prefix={<Coins className={ICON} />}
                        value={v.customerLoyaltyValueThreshold ?? ""}
                        onChange={(e) =>
                          p.setField(
                            "customerLoyaltyValueThreshold",
                            parseOptionalNumber(e.target.value),
                          )
                        }
                        placeholder="1000"
                        disabled={d}
                      />
                    )}
                  </Field>
                </>
              )}
              <Field
                label="Minimum to redeem"
                hint="Balance a customer needs before they can spend points."
              >
                {(id) => (
                  <ControlInput
                    id={id}
                    type="number"
                    inputMode="numeric"
                    mono
                    min={0}
                    suffix={PTS}
                    prefix={<Star className={ICON} />}
                    value={v.customerLoyaltyMinimumRedeemablePoints ?? ""}
                    onChange={(e) =>
                      p.setField(
                        "customerLoyaltyMinimumRedeemablePoints",
                        parseOptionalNumber(e.target.value),
                      )
                    }
                    placeholder="0"
                    disabled={d}
                  />
                )}
              </Field>
            </div>
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        icon={<Users className="h-4 w-4" />}
        title="Staff points"
        description="Reward staff for closing orders. A separate wallet from customer loyalty."
      >
        <ToggleRow
          label="Staff points"
          hint="Award points to staff on qualifying orders."
          checked={!!v.enableStaffPoints}
          onChange={(x) => p.setField("enableStaffPoints", x)}
          disabled={d}
        />

        {v.enableStaffPoints && (
          <div className="space-y-3.5 border-t border-dashed border-line pt-4">
            <div className="space-y-[7px]">
              <span className={standaloneLabelClass}>How points are earned</span>
              <SegmentedRadio
                value={v.staffPointsAwardType ?? "PER_ORDER"}
                onChange={(val) =>
                  p.setField(
                    "staffPointsAwardType",
                    val as LocationSettings["staffPointsAwardType"],
                  )
                }
                options={LOYALTY_AWARD_TYPE_OPTIONS}
                disabled={d}
              />
            </div>

            <div className="space-y-[7px]">
              <span className={standaloneLabelClass}>Who receives the points</span>
              <RadioCards
                value={v.staffPointsRecipient ?? "FINISHED_BY"}
                onChange={(val) =>
                  p.setField(
                    "staffPointsRecipient",
                    val as LocationSettings["staffPointsRecipient"],
                  )
                }
                options={RECIPIENT_CARDS}
                disabled={d}
              />
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {v.staffPointsAwardType === "PER_ORDER" ? (
                <Field label="Points per order" hint="Awarded once per qualifying order.">
                  {(id) => (
                    <ControlInput
                      id={id}
                      type="number"
                      inputMode="numeric"
                      mono
                      min={1}
                      suffix={PTS}
                      prefix={<Award className={ICON} />}
                      value={v.staffPointsPerOrder ?? ""}
                      onChange={(e) =>
                        p.setField("staffPointsPerOrder", parseOptionalNumber(e.target.value))
                      }
                      placeholder="1"
                      disabled={d}
                    />
                  )}
                </Field>
              ) : (
                <>
                  <Field label="Points awarded" hint="Per threshold reached below.">
                    {(id) => (
                      <ControlInput
                        id={id}
                        type="number"
                        inputMode="numeric"
                        mono
                        min={1}
                        suffix={PTS}
                        prefix={<Award className={ICON} />}
                        value={v.staffPointsPerValue ?? ""}
                        onChange={(e) =>
                          p.setField("staffPointsPerValue", parseOptionalNumber(e.target.value))
                        }
                        placeholder="1"
                        disabled={d}
                      />
                    )}
                  </Field>
                  <Field label="Value threshold" hint="Order value that earns those points.">
                    {(id) => (
                      <ControlInput
                        id={id}
                        type="number"
                        inputMode="decimal"
                        mono
                        min={1}
                        suffix={currency}
                        prefix={<Coins className={ICON} />}
                        value={v.staffPointsValueThreshold ?? ""}
                        onChange={(e) =>
                          p.setField(
                            "staffPointsValueThreshold",
                            parseOptionalNumber(e.target.value),
                          )
                        }
                        placeholder="1000"
                        disabled={d}
                      />
                    )}
                  </Field>
                </>
              )}
              <Field label="Minimum to redeem" hint="Balance staff need before spending points.">
                {(id) => (
                  <ControlInput
                    id={id}
                    type="number"
                    inputMode="numeric"
                    mono
                    min={0}
                    suffix={PTS}
                    prefix={<Star className={ICON} />}
                    value={v.staffMinimumRedeemablePoints ?? ""}
                    onChange={(e) =>
                      p.setField(
                        "staffMinimumRedeemablePoints",
                        parseOptionalNumber(e.target.value),
                      )
                    }
                    placeholder="0"
                    disabled={d}
                  />
                )}
              </Field>
            </div>
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        icon={<CalendarClock className="h-4 w-4" />}
        title="Point expiration"
        description="Applies to both customer and staff points."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ToggleRow
            label="Expire unused points"
            hint="Points lapse if untouched for the window below."
            checked={!!v.enablePointExpiration}
            onChange={(x) => p.setField("enablePointExpiration", x)}
            disabled={d}
            className="sm:col-span-1 lg:col-span-2"
          />
          <Field label="Expire after" hint="Counted from the last time points moved.">
            {(id) => (
              <ControlInput
                id={id}
                type="number"
                inputMode="numeric"
                mono
                min={1}
                max={3650}
                suffix="days"
                prefix={<CalendarClock className={ICON} />}
                value={v.pointExpirationDays ?? ""}
                onChange={(e) =>
                  p.setField("pointExpirationDays", parseOptionalNumber(e.target.value))
                }
                placeholder="365"
                disabled={d || !v.enablePointExpiration}
              />
            )}
          </Field>
        </div>
      </SettingsSection>

      <SettingsSaveBar
        dirtyCount={p.dirtyCount}
        isPending={p.isPending}
        onSave={p.save}
        onDiscard={() => p.reset()}
      />
    </div>
  );
}
