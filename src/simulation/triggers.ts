import type { Trigger } from "../content/schema";

export interface TriggerContext {
  allocationDollars: number;
  totalAllocationDollars: number;
  day: number;
  successConditionsMet?: boolean;
}

export function evaluateTrigger(trigger: Trigger, context: TriggerContext): boolean {
  const results: boolean[] = [];

  if (trigger.always !== undefined) results.push(trigger.always);
  if (trigger.all) results.push(trigger.all.every((item) => evaluateTrigger(item, context)));
  if (trigger.any) results.push(trigger.any.some((item) => evaluateTrigger(item, context)));
  if (trigger.not) results.push(!evaluateTrigger(trigger.not, context));
  if (trigger.allocation_at_most_dollars !== undefined) {
    results.push(context.allocationDollars <= trigger.allocation_at_most_dollars);
  }
  if (trigger.allocation_above_dollars !== undefined) {
    results.push(context.allocationDollars > trigger.allocation_above_dollars);
  }
  if (trigger.minimum_total_allocation_dollars !== undefined) {
    results.push(context.totalAllocationDollars >= trigger.minimum_total_allocation_dollars);
  }
  if (trigger.committed_by_day !== undefined) {
    results.push(context.day <= trigger.committed_by_day);
  }
  if (trigger.success_conditions_met !== undefined) {
    results.push(context.successConditionsMet === trigger.success_conditions_met);
  }

  return results.length > 0 && results.every(Boolean);
}
