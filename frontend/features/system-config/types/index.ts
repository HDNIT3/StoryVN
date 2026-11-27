export type ConfigFields = {
  config_key: string;
  config_value: string;
  description: string;
};

export type ConfigEntry = ConfigFields & { updated_by: string; updated_at: string };

export type FooterConfig = Partial<Record<
  "footer.tagline" | "footer.description" | "footer.credit" | "footer.disclaimer",
  string
>>;
