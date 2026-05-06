"use client";

import { useRouter } from "next/navigation";

export function AutoSubmitSelect({
  name,
  defaultValue,
  className,
  options,
}: {
  name: string;
  defaultValue: string;
  className?: string;
  options: { label: string; value: string }[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className={className}
      onChange={(e) => e.target.form?.requestSubmit()}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function ConfirmButton({
  type = "submit",
  className,
  title,
  confirmMessage,
  children,
}: {
  type?: "submit" | "button";
  className?: string;
  title?: string;
  confirmMessage: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type={type}
      className={className}
      title={title}
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
