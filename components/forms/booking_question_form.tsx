"use client";

import React, { useCallback, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { UUID } from "node:crypto";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  X,
  MessageSquare,
  CheckSquare,
  List,
  AlignLeft,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

import {
  BookingQuestion,
  BookingQuestionType,
} from "@/types/reservation-setting/type";
import { BookingQuestionSchema } from "@/types/reservation-setting/schema";
import {
  createBookingQuestion,
  updateBookingQuestion,
  deleteBookingQuestion,
} from "@/lib/actions/reservation-setting-actions";

const QUESTION_TYPE_LABELS: Record<BookingQuestionType, string> = {
  MULTI_SELECT: "Multi-Select",
  SINGLE_SELECT: "Single-Select",
  ACKNOWLEDGEMENT: "Acknowledgement",
  FREE_TEXT: "Free Text",
};

const QUESTION_TYPE_ICONS: Record<BookingQuestionType, React.ReactNode> = {
  MULTI_SELECT: <CheckSquare className="h-4 w-4" />,
  SINGLE_SELECT: <List className="h-4 w-4" />,
  ACKNOWLEDGEMENT: <MessageSquare className="h-4 w-4" />,
  FREE_TEXT: <AlignLeft className="h-4 w-4" />,
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
            optionValue: o.optionValue,
            sortOrder: o.sortOrder,
          })),
        }
      : {
          questionText: "",
          questionType: "FREE_TEXT" as BookingQuestionType,
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
    questionType === "MULTI_SELECT" || questionType === "SINGLE_SELECT";

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
          optionValue: o.optionValue,
          sortOrder: o.sortOrder,
        })),
      });
    } else {
      form.reset({
        questionText: "",
        questionType: "FREE_TEXT",
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
          toast({ title: "Success", description: data.message });
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
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="questionText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Do you have any dietary requirements?"
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="questionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FREE_TEXT">Free Text</SelectItem>
                        <SelectItem value="SINGLE_SELECT">
                          Single Select
                        </SelectItem>
                        <SelectItem value="MULTI_SELECT">
                          Multi Select
                        </SelectItem>
                        <SelectItem value="ACKNOWLEDGEMENT">
                          Acknowledgement
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
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
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

            <div className="flex gap-6">
              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Required</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Active</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {needsOptions && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Options</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          optionValue: "",
                          sortOrder: fields.length,
                        })
                      }
                      disabled={isPending}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Option
                    </Button>
                  </div>

                  {fields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                      No options yet. Add at least 2 options for select-type
                      questions.
                    </p>
                  )}

                  {fields.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <FormField
                        control={form.control}
                        name={`options.${index}.optionValue`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={`Option ${index + 1}`}
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={isPending}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
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
                {isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isPending
                  ? "Saving..."
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
      toast({ title: "Success", description: "Question deleted successfully" });
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Booking Questions</CardTitle>
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sortedQuestions.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No booking questions yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add custom questions for guests to answer during booking
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleAdd}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add First Question
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedQuestions.map((question) => (
                <div
                  key={question.id}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {question.questionText}
                      </span>
                      {question.required && (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {!question.active && (
                        <Badge variant="outline" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {QUESTION_TYPE_ICONS[question.questionType]}
                        <span>
                          {QUESTION_TYPE_LABELS[question.questionType]}
                        </span>
                      </div>
                      {question.options.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          &middot; {question.options.length} options
                        </span>
                      )}
                    </div>
                    {question.options.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {question.options
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((opt, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs font-normal"
                            >
                              {opt.optionValue}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(question)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(question.id)}
                      disabled={deletingId === question.id}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      {deletingId === question.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
