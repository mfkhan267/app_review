// Single source of truth for status / layer / navigation metadata.

// Most urgent first. Used for sorting and "worst status" calculations.
export const STATUS_ORDER = ["RED", "AMBER", "BLUE", "GREEN"];

export const STATUS = {
  RED:   { key: "RED",   label: "Red",   short: "Unsupported", desc: "Past End of Support",                    color: "#e5484d", tint: "#fdecec", ink: "#a4262c" },
  AMBER: { key: "AMBER", label: "Amber", short: "Expiring",    desc: "Less than 18 months to End of Support",  color: "#f5a524", tint: "#fff3d6", ink: "#8a5a00" },
  BLUE:  { key: "BLUE",  label: "Blue",  short: "Extended",    desc: "Extended Support purchased",             color: "#3b6cf6", tint: "#e8efff", ink: "#2547b8" },
  GREEN: { key: "GREEN", label: "Green", short: "Supported",   desc: "More than 18 months to End of Support",  color: "#2e9d5b", tint: "#e6f5ec", ink: "#1b6b3c" },
};

export const LAYERS = ["Application", "Database", "OS"];

// Layer colours are deliberately purple tones so they never read as RAG status colours.
export const LAYER = {
  Application: { key: "Application", label: "Applications",      singular: "Application", short: "Apps", icon: "grid",     color: "#3f33a6" },
  Database:    { key: "Database",    label: "Databases",         singular: "Database",    short: "Databases", icon: "database", color: "#7a68dc" },
  OS:          { key: "OS",          label: "Operating Systems", singular: "OS",          short: "OS", icon: "server",   color: "#b7abf0" },
};

export const TABS = [
  { id: "dashboard",   label: "Dashboard",    hash: "dashboard" },
  { id: "Application", label: "Applications", hash: "applications" },
  { id: "Database",    label: "Databases",    hash: "databases" },
  { id: "OS",          label: "OS",           hash: "os" },
  { id: "remediation", label: "Remediation",  hash: "remediation" },
  { id: "catalog",     label: "Catalog",      hash: "catalog" },
];
