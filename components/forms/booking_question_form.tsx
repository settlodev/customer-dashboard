"use client";

import React, { useCallback, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { UUID } from "node:crypto";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ControlInput,
  FieldLabel,
  ToggleRow,
  controlSelectTriggerClass,
  standaloneLabelClass,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SettingsSection } from "@/components/settings/shared/settings-section";
import { ConfirmDeleteButton } from "@/components/settings/shared/confirm-delete-button";
import {
  RowTag,
  SettingsTableCard,
  tableHeadRowClass,
  tdActionsClass,
  tdClass,
  thClass,
  trClass,
} from "@/components/settings/shared/settings-table";
import {
  Loader2,
  Plus,
  GripVertical,
  X,
  Hash,
  HelpCircle,
  MessageSquare,
  MessageSquareText,
  CheckSquare,
  List,
  AlignLeft,
  Tag,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { BookingQuestion } from "@/types/reservation-setting/type";
import { BookingQuestionType } from "@/types/enums";
import { BookingQuestionSchema } from "@/types/reservation-setting/schema";
import {
  createBookingQuestion,
  updateBookingQuestion,
  deleteBookingQuestion,
} from "@/lib/actions/reservation-setting-actions";

const QUESTION_TYPE_LABELS: Record<BookingQuestionType, string> = {
  [BookingQuestionType.TEXT]: "Free text",
  [BookingQuestionType.NUMBER]: "Number",
  [BookingQuestionType.BOOLEAN]: "Yes / No",
  [BookingQuestionType.SINGLE_CHOICE]: "Single choice",
  [BookingQuestionType.MULTI_CHOICE]: "Multiple choice",
};

const QUESTION_TYPE_ICONS: Record<BookingQuestionType, React.ReactNode> = {
  [BookingQuestionType.TEXT]: <AlignLeft className="h-3.5 w-3.5" />,
  [BookingQuestionType.NUMBER]: <Hash className="h-3.5 w-3.5" />,
  [BookingQuestionType.BOOLEAN]: <MessageSquare className="h-3.5 w-3.5" />,
  [BookingQuestionType.SINGLE_CHOICE]: <List className="h-3.5 w-3.5" />,
  [BookingQuestionType.MULTI_CHOICE]: <CheckSquare className="h-3.5 w-3.5" />,
};

type BookingQuestionFormValues = z.infer<typeof BookingQuestionSchema>;

const QuestionDialog = ({
  open,
  onOpenChange,
  editingQuestion,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingQuestion: BookingQuestion | null;
  onSaved: () => void;
}) => {
  const [isPending, startTransition] = useTransition();

  const form = useForm<BookingQuestionFormValues>({
    resolver: zodResolver(BookingQuestionSchema),
    defaultValues: editingQuestion
      ? {
          questionText: editingQuestion.questionText,
          questionType: editingQuestion.questionType,
          required: editingQuestion.required,
          sortOrder: editingQuestion.sortOrder,
          active: editingQuestion.active,
          options: editingQuestion.options.map((o) => ({
            id: o.id as string | undefined,
            label: o.label,
            value: o.value,
            sortOrder: o.sortOrder,
          })),
        }
      : {
          questionText: "",
          questionType: BookingQuestionType.TEXT,
          required: false,
          sortOrder: 0,
          active: true,
          options: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const questionType = form.watch("questionType");
  const needsOptions =
    questionType === BookingQuestionType.SINGLE_CHOICE ||
    questionType === BookingQuestionType.MULTI_CHOICE;

  React.useEffect(() => {
    if (editingQuestion) {
      form.reset({
        questionText: editingQuestion.questionText,
        questionType: editingQuestion.questionType,
        required: editingQuestion.required,
        sortOrder: editingQuestion.sortOrder,
        active: editingQuestion.active,
        options: editingQuestion.options.map((o) => ({
          id: o.id as string | undefined,
          label: o.label,
          value: o.value,
          sortOrder: o.sortOrder,
        })),
      });
    } else {
      form.reset({
        questionText: "",
        questionType: BookingQuestionType.TEXT,
        required: false,
        sortOrder: 0,
        active: true,
        options: [],
      });
    }
  }, [editingQuestion, form]);

  const onInvalid = useCallback((errors: FieldErrors) => {
    console.error("Form validation errors:", errors);
    const firstError = Object.values(errors)[0];
    toast({
      variant: "destructive",
      title: "Validation Error",
      description:
        typeof firstError?.message === "string"
          ? firstError.message
          : "Please fill all the required fields",
    });
  }, []);

  const submitData = (values: BookingQuestionFormValues) => {
    startTransition(async () => {
      const action = editingQuestion
        ? updateBookingQuestion(editingQuestion.id, values)
        : createBookingQuestion(values);

      const data = await action;
      if (data) {
        if (data.responseType === "success") {
          toast({ variant: "success", title: "Success", description: data.message });
          onOpenChange(false);
          onSaved();
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: data.message,
          });
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingQuestion ? "Edit Question" : "Add Booking Question"}
          </DialogTitle>
          <DialogDescription>
            {editingQuestion
              ? "Update the booking question details"
              : "Create a new question for guests to answer during booking"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitData, onInvalid)}
            className="space-y-3.5"
          >
            <FormField
              control={form.control}
              name="questionText"
              render={({ field }) => (
                <FormItem className="min-w-0 space-y-[7px]">
                  <FieldLabel required>Question</FieldLabel>
                  <FormControl>
                    <ControlInput
                      {...field}
                      prefix={<HelpCircle className="h-3.5 w-3.5" />}
                      placeholder="e.g., Do you have any dietary requirements?"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="questionType"
                render={({ field }) => (
                  <FormItem className="min-w-0 space-y-[7px]">
                    <FieldLabel required>Type</FieldLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger className={controlSelectTriggerClass}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={BookingQuestionType.TEXT}>Free text</SelectItem>
                        <SelectItem value={BookingQuestionType.NUMBER}>Number</SelectItem>
                        <SelectItem value={BookingQuestionType.BOOLEAN}>Yes / No</SelectItem>
                        <SelectItem value={BookingQuestionType.SINGLE_CHOICE}>
                          Single choice
                        </SelectItem>
                        <SelectItem value={BookingQuestionType.MULTI_CHOICE}>
                          Multiple choice
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem className="min-w-0 space-y-[7px]">
                    <FieldLabel>Sort Order</FieldLabel>
                    <FormControl>
                      <ControlInput
                        {...field}
                        type="number"
                        mono
                        min={0}
                        prefix={<Hash className="h-3.5 w-3.5" />}
                        disabled={isPending}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <ToggleRow
                    label="Required"
                    hint="Guests can't finish the booking without answering."
                    checked={!!field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <ToggleRow
                    label="Active"
                    hint="Turn off to hide the question without deleting it."
                    checked={!!field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
            </div>

            {needsOptions && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className={standaloneLabelClass}>Options</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          label: "",
                          value: "",
                          sortOrder: fields.length,
                        })
                      }
                      disabled={isPending}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Option
                    </Button>
                  </div>

                  {fields.length === 0 && (
                    <p className="rounded-lg border border-dashed border-line py-4 text-center text-sm text-muted-foreground">
                      No options yet. Add at least 2 options for select-type
                      questions.
                    </p>
                  )}

                  {fields.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-2">
                      <GripVertical className="mt-3.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`options.${index}.label`}
                          render={({ field }) => (
                            <FormItem className="min-w-0 space-y-[7px]">
                              <FormControl>
                                <ControlInput
                                  {...field}
                                  prefix={<Tag className="h-3.5 w-3.5" />}
                                  placeholder={`Label ${index + 1}`}
                                  disabled={isPending}
                                  onChange={(e) => {
                                    const labelValue = e.target.value;
                                    field.onChange(labelValue);
                                    // Mirror label into value when value is empty —
                                    // most options use the same string for both.
                                    const currentValue = form.getValues(
                                      `options.${index}.value`,
                                    );
                                    if (!currentValue) {
                                      form.setValue(
                                        `options.${index}.value`,
                                        labelValue,
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`options.${index}.value`}
                          render={({ field }) => (
                            <FormItem className="min-w-0 space-y-[7px]">
                              <FormControl>
                                <ControlInput
                                  {...field}
                                  mono
                                  prefix={<Hash className="h-3.5 w-3.5" />}
                                  placeholder={`Value ${index + 1}`}
                                  disabled={isPending}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="iconSm"
                        onClick={() => remove(index)}
                        disabled={isPending}
                        aria-label={`Remove option ${index + 1}`}
                        className="mt-2 shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

                  {form.formState.errors.options?.root && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.options.root.message}
                    </p>
                  )}
                </div>
              </>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isPending
                  ? "Saving…"
                  : editingQuestion
                    ? "Update Question"
                    : "Create Question"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const BookingQuestionsManager = ({
  questions,
  onRefresh,
}: {
  questions: BookingQuestion[];
  onRefresh: () => void;
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<BookingQuestion | null>(null);
  const [deletingId, setDeletingId] = useState<UUID | null>(null);

  const handleEdit = (question: BookingQuestion) => {
    setEditingQuestion(question);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingQuestion(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: UUID) => {
    setDeletingId(id);
    try {
      await deleteBookingQuestion(id);
      toast({ variant: "success", title: "Success", description: "Question deleted successfully" });
      onRefresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete question",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const sortedQuestions = [...questions].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <>
      <SettingsSection
        icon={<MessageSquareText className="h-4 w-4" />}
        title="Booking questions"
        description="Extra questions guests answer while booking — dietary needs, occasion, seating preference."
        footer={
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5" /> Add question
          </Button>
        }
      >
        <SettingsTableCard
          isEmpty={sortedQuestions.length === 0}
          emptyLabel="No booking questions yet. Add one to collect what you need before guests arrive."
        >
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className={tableHeadRowClass}>
                <th className={thClass}>Question</th>
                <th className={thClass}>Type</th>
                <th className={`${thClass} text-right`}>Order</th>
                <th className={thClass}>Status</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedQuestions.map((question) => {
                const optionLabels = [...question.options]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((o) => o.label)
                  .join(" · ");
                return (
                  <tr key={question.id} className={trClass}>
                    <td className={tdClass}>
                      <span className="font-medium">{question.questionText}</span>
                      {question.required && <RowTag>Required</RowTag>}
                      {optionLabels && (
                        <span className="mt-1 block text-[12px] text-muted-foreground">
                          {optionLabels}
                        </span>
                      )}
                    </td>
                    <td className={tdClass}>
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
                        {QUESTION_TYPE_ICONS[question.questionType]}
                        {QUESTION_TYPE_LABELS[question.questionType]}
                      </span>
                    </td>
                    <td
                      className={`${tdClass} text-right font-mono text-[12px] tabular-nums text-ink-2`}
                    >
                      {question.sortOrder}
                    </td>
                    <td className={tdClass}>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
                          question.active ? "text-pos" : "text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            question.active ? "bg-pos" : "bg-muted-2"
                          }`}
                        />
                        {question.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className={tdActionsClass}>
                      <div className="inline-flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(question)}
                        >
                          Edit
                        </Button>
                        <ConfirmDeleteButton
                          disabled={deletingId === question.id}
                          onConfirm={() => handleDelete(question.id)}
                          title="Delete this booking question?"
                          description={`"${question.questionText}" stops appearing on the booking page. Answers already collected on existing reservations are kept, but no new ones will be gathered.`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SettingsTableCard>
      </SettingsSection>

      <QuestionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingQuestion={editingQuestion}
        onSaved={onRefresh}
      />
    </>
  );
};

export default BookingQuestionsManager;
