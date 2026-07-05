import "server-only";

// WordPress-style hook bus. Plugins register actions (side effects) and filters
// (transform a value). Core code fires them at well-known extension points.

type AnyArgs = unknown[];
type ActionFn = (...args: AnyArgs) => void | Promise<void>;
type FilterFn<T = unknown> = (value: T, ...args: AnyArgs) => T | Promise<T>;

type Registered<F> = { fn: F; priority: number; owner: string };

class HookBus {
  private actions = new Map<string, Registered<ActionFn>[]>();
  private filters = new Map<string, Registered<FilterFn>[]>();

  addAction(name: string, fn: ActionFn, priority = 10, owner = "core") {
    const list = this.actions.get(name) ?? [];
    list.push({ fn, priority, owner });
    list.sort((a, b) => a.priority - b.priority);
    this.actions.set(name, list);
  }

  addFilter<T>(name: string, fn: FilterFn<T>, priority = 10, owner = "core") {
    const list = this.filters.get(name) ?? [];
    list.push({ fn: fn as FilterFn, priority, owner });
    list.sort((a, b) => a.priority - b.priority);
    this.filters.set(name, list);
  }

  /** Run all actions for `name`. Failures are isolated (logged, not thrown). */
  async doAction(name: string, ...args: AnyArgs): Promise<void> {
    for (const { fn, owner } of this.actions.get(name) ?? []) {
      try {
        await fn(...args);
      } catch (err) {
        // Lazy import to avoid a hard dependency cycle.
        const { logger } = await import("@/lib/logger");
        logger.error({ err, hook: name, owner }, "Hook action failed");
      }
    }
  }

  /** Reduce `value` through all filters for `name`. */
  async applyFilters<T>(name: string, value: T, ...args: AnyArgs): Promise<T> {
    let acc = value;
    for (const { fn, owner } of this.filters.get(name) ?? []) {
      try {
        acc = (await fn(acc, ...args)) as T;
      } catch (err) {
        const { logger } = await import("@/lib/logger");
        logger.error({ err, hook: name, owner }, "Hook filter failed");
      }
    }
    return acc;
  }

  /** Remove all hooks registered by a given owner (plugin slug). */
  removeByOwner(owner: string) {
    for (const [name, list] of this.actions) {
      this.actions.set(
        name,
        list.filter((r) => r.owner !== owner),
      );
    }
    for (const [name, list] of this.filters) {
      this.filters.set(
        name,
        list.filter((r) => r.owner !== owner),
      );
    }
  }
}

// Core hook names (extension points).
export const HOOKS = {
  contentAfterSave: "content.afterSave",
  contentAfterDelete: "content.afterDelete",
  userAfterSave: "user.afterSave",
  userAfterDelete: "user.afterDelete",
  roleAfterSave: "role.afterSave",
  roleAfterDelete: "role.afterDelete",
  pageContext: "page.context",
  pageHtml: "page.html",
  adminMenu: "admin.menu",
} as const;

export const hooks = new HookBus();
export type { ActionFn, FilterFn };
