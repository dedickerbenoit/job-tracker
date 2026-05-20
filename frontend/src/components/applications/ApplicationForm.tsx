import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { STATUS_CONFIG, SOURCE_CONFIG } from "@/lib/constants";
import { t } from "@/lib/i18n";
import type {
  Application,
  ApplicationStatus,
  CreateApplicationData,
} from "@/types";

const schema = z.object({
  title: z.string().min(1, t.form.validation.titleRequired).max(255),
  company: z.string().min(1, t.form.validation.companyRequired).max(255),
  location: z.string().min(1, t.form.validation.locationRequired).max(255),
  url: z
    .string()
    .min(1, t.form.validation.urlRequired)
    .url(t.form.validation.urlInvalid)
    .max(2048),
  description: z.string().optional(),
  source: z.enum(["linkedin", "indeed", "manual"] as const),
  status: z
    .enum([
      "to_apply",
      "applied",
      "follow_up",
      "interview",
      "offer",
      "rejected",
    ] as const)
    .optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ApplicationFormProps {
  application?: Application | null;
  onSubmit: (data: CreateApplicationData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ApplicationForm({
  application,
  onSubmit,
  onCancel,
  loading,
}: ApplicationFormProps) {
  const isEdit = !!application;

  const validSources: FormValues["source"][] = ["linkedin", "indeed", "manual"];
  const safeSource = (s?: string): FormValues["source"] =>
    validSources.includes(s as FormValues["source"])
      ? (s as FormValues["source"])
      : "manual";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: application?.title ?? "",
      company: application?.company ?? "",
      location: application?.location ?? "",
      url: application?.url ?? "",
      description: application?.description ?? "",
      source: safeSource(application?.source),
      status: application?.status ?? "to_apply",
      notes: application?.notes ?? "",
    },
  });

  const sourceValue = watch("source");
  const statusValue = watch("status");

  const handleFormSubmit = async (values: FormValues) => {
    await onSubmit(values as CreateApplicationData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title">{t.form.jobTitle}</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder={t.form.jobTitlePlaceholder}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* Company */}
        <div className="space-y-1.5">
          <Label htmlFor="company">{t.form.company}</Label>
          <Input
            id="company"
            {...register("company")}
            placeholder="Acme Corp"
          />
          {errors.company && (
            <p className="text-xs text-destructive">{errors.company.message}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <Label htmlFor="location">{t.form.location}</Label>
          <Input
            id="location"
            {...register("location")}
            placeholder={t.form.locationPlaceholder}
          />
          {errors.location && (
            <p className="text-xs text-destructive">
              {errors.location.message}
            </p>
          )}
        </div>

        {/* URL */}
        <div className="space-y-1.5">
          <Label htmlFor="url">{t.form.jobUrl}</Label>
          <Input id="url" {...register("url")} placeholder="https://..." />
          {errors.url && (
            <p className="text-xs text-destructive">{errors.url.message}</p>
          )}
        </div>

        {/* Source */}
        <div className="space-y-1.5">
          <Label>{t.list.columns.source}</Label>
          <Select
            value={sourceValue}
            onValueChange={(v) => setValue("source", v as FormValues["source"])}
          >
            <SelectTrigger>
              <span className="flex flex-1 text-left" data-slot="select-value">
                {SOURCE_CONFIG[sourceValue]?.label ?? sourceValue}
              </span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label>{t.list.columns.status}</Label>
          <Select
            value={statusValue}
            onValueChange={(v) => setValue("status", v as ApplicationStatus)}
          >
            <SelectTrigger>
              <span className="flex flex-1 text-left" data-slot="select-value">
                {statusValue ? STATUS_CONFIG[statusValue].label : ""}
              </span>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">{t.application.description}</Label>
        <Textarea
          id="description"
          {...register("description")}
          rows={3}
          placeholder={t.form.descriptionPlaceholder}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">{t.form.personalNotes}</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          rows={2}
          placeholder={t.form.notesPlaceholder}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t.common.saving : isEdit ? t.common.save : t.common.add}
        </Button>
      </div>
    </form>
  );
}
