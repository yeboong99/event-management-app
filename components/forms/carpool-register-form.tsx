"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { registerCarpool } from "@/actions/carpools";
import { CarpoolConflictDialog } from "@/components/shared/carpool-conflict-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type RegisterCarpoolInput,
  registerCarpoolSchema,
} from "@/lib/validations/carpool";

interface CarpoolRegisterFormProps {
  eventId: string;
  // 등록 성공 후 부모 컴포넌트에서 폼 닫기 등의 후처리를 위한 콜백
  onSuccess?: () => void;
}

export function CarpoolRegisterForm({
  eventId,
  onSuccess,
}: CarpoolRegisterFormProps) {
  const [isPending, startTransition] = useTransition();
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  const form = useForm<RegisterCarpoolInput>({
    resolver: zodResolver(registerCarpoolSchema),
    defaultValues: {
      eventId,
      departurePlace: "",
      departureTime: "",
      totalSeats: 2,
      description: "",
    },
  });

  const onSubmit = (data: RegisterCarpoolInput) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("eventId", data.eventId);
      formData.set("departurePlace", data.departurePlace);
      formData.set("departureTime", data.departureTime ?? "");
      formData.set("totalSeats", String(data.totalSeats));
      formData.set("description", data.description ?? "");

      const result = await registerCarpool(formData);
      if (result.success) {
        toast.success("카풀이 등록되었습니다.");
        // 부모 컴포넌트에서 폼 닫기 등의 후처리 실행
        onSuccess?.();
        form.reset({
          eventId,
          departurePlace: "",
          departureTime: "",
          totalSeats: 2,
          description: "",
        });
      } else if (result.errorCode === "CARPOOL_CONFLICT") {
        setConflictMessage(result.error ?? "카풀 참여 제한에 걸렸습니다.");
      } else {
        toast.error(result.error ?? "등록 중 오류가 발생했습니다.");
      }
    });
  };

  return (
    <>
      <CarpoolConflictDialog
        open={conflictMessage !== null}
        onClose={() => setConflictMessage(null)}
        message={conflictMessage ?? ""}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* 출발지 */}
          <FormField
            control={form.control}
            name="departurePlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>출발지</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="예: 강남역 2번 출구" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 출발 시간 */}
          <FormField
            control={form.control}
            name="departureTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>출발 시간 (선택)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="datetime-local"
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 좌석 수 */}
          <FormField
            control={form.control}
            name="totalSeats"
            render={({ field }) => (
              <FormItem>
                <FormLabel>좌석 수 (본인 포함)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 1)
                    }
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 안내사항 */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>안내사항 (선택)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="탑승자에게 전달할 내용을 입력해주세요..."
                    rows={3}
                    maxLength={300}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "등록 중..." : "카풀 등록"}
          </Button>
        </form>
      </Form>
    </>
  );
}
