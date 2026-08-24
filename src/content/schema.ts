import { z } from "zod";

const money = z.number().int().nonnegative().safe();
const score = z.number().finite();
const identifier = z
  .string()
  .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "must be a stable lowercase ID");

export type Trigger = {
  always?: boolean;
  all?: Trigger[];
  any?: Trigger[];
  not?: Trigger;
  allocation_at_most_dollars?: number;
  allocation_above_dollars?: number;
  minimum_total_allocation_dollars?: number;
  committed_by_day?: number;
  success_conditions_met?: boolean;
};

export const triggerSchema: z.ZodType<Trigger> = z.lazy(() =>
  z
    .object({
      always: z.boolean().optional(),
      all: z.array(triggerSchema).min(1).optional(),
      any: z.array(triggerSchema).min(1).optional(),
      not: triggerSchema.optional(),
      allocation_at_most_dollars: money.optional(),
      allocation_above_dollars: money.optional(),
      minimum_total_allocation_dollars: money.optional(),
      committed_by_day: z.number().int().positive().optional(),
      success_conditions_met: z.boolean().optional()
    })
    .strict()
    .refine((value) => Object.keys(value).length > 0, "trigger cannot be empty")
);

const effectsSchema = z.record(z.string(), score);

const initialArticleSchema = z
  .object({
    id: identifier,
    priority: z.number().int().default(10),
    when: triggerSchema.optional(),
    headline: z.string().min(1),
    body_markdown: z.string().min(1)
  })
  .strict();

const memoSchema = z
  .object({
    id: identifier,
    priority: z.number().int().default(10),
    when: triggerSchema,
    deliver_after_days: z.number().int().nonnegative(),
    related_extra: identifier.optional(),
    subject: z.string().min(1),
    body_markdown: z.string().min(1)
  })
  .strict();

const extraSchema = z
  .object({
    id: identifier,
    priority: z.number().int().default(10),
    when: triggerSchema,
    publish_after_days: z.number().int().positive(),
    headline: z.string().min(1),
    body_markdown: z.string().min(1)
  })
  .strict();

const rulesSchema = z
  .object({
    disposition: z.enum(["beneficial", "neutral", "harmful", "speculative"]),
    absorptive_capacity_dollars: money.optional(),
    fraud_fraction: z.number().min(0).max(1).optional(),
    world_effects: effectsSchema.default({}),
    holding: z
      .object({
        initial_value_ratio: z.number().positive(),
        success_value_ratio: z.number().nonnegative().optional(),
        failure_value_ratio: z.number().nonnegative().optional()
      })
      .strict()
      .optional(),
    success: triggerSchema.optional(),
    overfunding: z
      .object({
        begins_above_dollars: money,
        effects: effectsSchema
      })
      .strict()
      .optional()
  })
  .strict();

const effectRuleSchema = z
  .object({
    when: triggerSchema,
    manifest_after_days: z.number().int().nonnegative(),
    apply: effectsSchema
  })
  .strict();

export const opportunitySchema = z
  .object({
    schema_version: z.literal(1),
    id: identifier,
    category: z.enum(["charity", "company", "real-estate"]),
    name: z.string().min(1),
    status: z.enum(["draft", "published"]).default("draft"),
    tags: z.array(identifier).default([]),
    availability: z
      .object({
        first_day: z.number().int().positive(),
        last_day: z.number().int().positive()
      })
      .strict()
      .refine((value) => value.last_day >= value.first_day, {
        message: "last_day must not precede first_day"
      }),
    dossier: z
      .object({
        summary: z.string().min(1),
        body_markdown: z.string().min(1)
      })
      .strict(),
    rules: rulesSchema,
    initial_coverage: z.array(initialArticleSchema).min(1),
    memos: z.array(memoSchema).default([]),
    extras: z.array(extraSchema).default([]),
    effects: z.array(effectRuleSchema).default([])
  })
  .strict()
  .superRefine((opportunity, context) => {
    const documentIds = [
      ...opportunity.initial_coverage.map((item) => item.id),
      ...opportunity.memos.map((item) => item.id),
      ...opportunity.extras.map((item) => item.id)
    ];
    const duplicateIds = documentIds.filter(
      (id, index) => documentIds.indexOf(id) !== index
    );
    if (duplicateIds.length > 0) {
      context.addIssue({
        code: "custom",
        path: ["initial_coverage"],
        message: `document IDs must be unique: ${[...new Set(duplicateIds)].join(", ")}`
      });
    }

    const extras = new Map(opportunity.extras.map((extra) => [extra.id, extra]));
    opportunity.memos.forEach((memo, index) => {
      if (!memo.related_extra) return;
      const relatedExtra = extras.get(memo.related_extra);
      if (!relatedExtra) {
        context.addIssue({
          code: "custom",
          path: ["memos", index, "related_extra"],
          message: `unknown extra ${memo.related_extra}`
        });
      } else if (memo.deliver_after_days >= relatedExtra.publish_after_days) {
        context.addIssue({
          code: "custom",
          path: ["memos", index, "deliver_after_days"],
          message: "a related memo must arrive before its extra"
        });
      }
    });
  });

export type Opportunity = z.infer<typeof opportunitySchema>;
