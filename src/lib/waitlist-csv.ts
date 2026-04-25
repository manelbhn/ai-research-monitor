type WaitlistExportRow = {
  full_name: string;
  email: string;
  company_name: string | null;
  phone_number: string | null;
  role: string | null;
  focus: string | null;
  created_at: Date;
};

function escapeCsv(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function toWaitlistCsv(rows: WaitlistExportRow[]): string {
  const header = [
    "full_name",
    "email",
    "company_name",
    "phone_number",
    "role",
    "focus",
    "created_at",
  ];

  const body = rows.map((row) =>
    [
      row.full_name,
      row.email,
      row.company_name || "",
      row.phone_number || "",
      row.role || "",
      row.focus || "",
      row.created_at.toISOString(),
    ]
      .map((item) => escapeCsv(item))
      .join(","),
  );

  return [header.join(","), ...body].join("\n");
}
