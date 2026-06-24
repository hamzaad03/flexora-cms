"use client";

import {
  ANIMATION_PRESETS,
  ANIMATION_TYPES,
  EASES,
  type Animation,
  type AnimationType,
} from "@/lib/animation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AnimationControl({
  value,
  onChange,
}: {
  value?: Animation;
  onChange: (a?: Animation) => void;
}) {
  const anim: Animation = value ?? { type: "none" };
  const set = (patch: Partial<Animation>) => onChange({ ...anim, ...patch });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {ANIMATION_PRESETS.map((p) => (
          <Button
            key={p.id}
            type="button"
            size="xs"
            variant="outline"
            onClick={() =>
              onChange(p.anim.type === "none" ? undefined : { ...p.anim })
            }
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Effect</Label>
          <Select
            value={anim.type}
            onValueChange={(v) =>
              !v || v === "none"
                ? onChange(undefined)
                : set({ type: v as AnimationType })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANIMATION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {anim.type !== "none" ? (
          <div className="space-y-1">
            <Label className="text-xs">Trigger</Label>
            <Select
              value={anim.trigger ?? "onscroll"}
              onValueChange={(v) =>
                set({ trigger: (v ?? "onscroll") as "onload" | "onscroll" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onscroll">On scroll</SelectItem>
                <SelectItem value="onload">On load</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {anim.type !== "none" ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Duration (s)</Label>
            <Input
              type="number"
              step="0.1"
              value={anim.duration ?? 0.6}
              onChange={(e) => set({ duration: e.target.valueAsNumber })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Delay (s)</Label>
            <Input
              type="number"
              step="0.1"
              value={anim.delay ?? 0}
              onChange={(e) => set({ delay: e.target.valueAsNumber })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Easing</Label>
            <Select
              value={anim.ease ?? "power2.out"}
              onValueChange={(v) => set({ ease: v ?? "power2.out" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EASES.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Stagger children (s)</Label>
            <Input
              type="number"
              step="0.05"
              value={anim.stagger ?? 0}
              onChange={(e) =>
                set({
                  stagger: Number.isNaN(e.target.valueAsNumber)
                    ? undefined
                    : e.target.valueAsNumber,
                })
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
