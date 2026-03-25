"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { updateCarpool } from "@/actions/carpools";
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
  type UpdateCarpoolInput,
  updateCarpoolSchema,
} from "@/lib/validations/carpool";

interface CarpoolUpdateFormProps {
  carpoolId: string;
  /** updateCarpool Action이 내부적으로 event_id를 DB에서 조회하므로 현재 미사용 (향후 확장 대비) */
  eventId?: string;
  defaultValues: {
    departurePlace: string;
    departureTime?: string | null;
    totalSeats: number;
    description?: string | null;
  };
  approvedCount: number;
  onSuccess?: () => void;
}

export function CarpoolUpdateForm({
  carpoolId,
  defaultValues,
  approvedCount,
  onSuccess,
}: CarpoolUpdateFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateCarpoolInput>({
    resolver: zodResolver(updateCarpoolSchema),
    defaultValues: {
      carpoolId,
      departurePlace: defaultValues.departurePlace,
      departureTime: defaultValues.departureTime ?? "",
      totalSeats: defaultValues.totalSeats,
      description: defaultValues.description ?? "",
    },
  });

  const onSubmit = (data: UpdateCarpoolInput) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("carpoolId", data.carpoolId);
      formData.set("departurePlace", data.departurePlace);
      formData.set("departureTime", data.departureTime ?? "");
      formData.set("totalSeats", String(data.totalSeats));
      formData.set("description", data.description ?? "");

      const result = await updateCarpool(formData);
      if (result.success) {
        toast.success("카풀 정보가 수정되었습니다.");
        onSuccess?.();
      } else {
        toast.error(result.error ?? "수정 중 오류가 발생했습니다.");
      }
    });
  };

  return (
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
                  max={20}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 1)
                  }
                  value={field.value}
                />
              </FormControl>
              {/* 현재 승인된 탑승자 수 힌트 */}
              <p className="text-muted-foreground text-sm">
                현재 승인된 탑승자: {approvedCount}명
              </p>
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
                  maxLength={500}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "수정 중..." : "수정 완료"}
        </Button>
      </form>
    </Form>
  );
}
