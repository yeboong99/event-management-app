"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { applyParticipation } from "@/actions/participations";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  type ApplyParticipationInput,
  applyParticipationSchema,
} from "@/lib/validations/participation";

interface ParticipationFormProps {
  eventId: string;
}

export function ParticipationForm({ eventId }: ParticipationFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ApplyParticipationInput>({
    resolver: zodResolver(applyParticipationSchema),
    defaultValues: { eventId, message: "" },
  });

  const onSubmit = (data: ApplyParticipationInput) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("eventId", data.eventId);
      formData.set("message", data.message ?? "");

      const result = await applyParticipation(formData);
      if (result.success) {
        toast.success("참여 신청이 완료되었습니다.");
        form.reset();
      } else {
        toast.error(result.error ?? "신청 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>신청 메시지 (선택)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="주최자에게 전달할 메시지를 입력해주세요..."
                  rows={3}
                  maxLength={200}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "신청 중..." : "참여 신청"}
        </Button>
      </form>
    </Form>
  );
}
