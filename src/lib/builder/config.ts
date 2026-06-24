// Feature flag for the visual page builder. Default-on in development so the
// first testable slice is easy to exercise; set FLX_BUILDER_ENABLED=false to
// hide the route/action without removing code.
export const BUILDER_ENABLED = process.env.FLX_BUILDER_ENABLED !== "false";
