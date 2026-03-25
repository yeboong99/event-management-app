"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { requestCarpool } from "@/actions/carpools";
import { CarpoolConflictDialog } from "@/components/shared/carpool-conflict-dialog";
import { CarpoolRequestStatus } from "@/components/shared/carpool-request-status";
import { Badge } from "@/components/ui/badge";
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
  type RequestCarpoolInput,
  requestCarpoolSchema,
} from "@/lib/validations/carpool";
import type { CarpoolRequest } from "@/types/carpool";

interface CarpoolRequestFormProps {
  carpoolId: string;
  totalSeats: number;
  approvedCount: number;
  currentUserId: string | null;
  driverId: string;
  existingRequest: CarpoolRequest | null;
  eventId: string;
  showCancel?: boolean; // CarpoolRequestStatus로 전달 — 내 카풀 탭에서 true
}

export function CarpoolRequestForm({
  carpoolId,
  totalSeats,
  approvedCount,
  currentUserId,
  driverId,
  existingRequest,
  eventId,
  showCancel,
}: CarpoolRequestFormProps) {
  const [isPending, startTransition] = useTransition();
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  const form = useForm<RequestCarpoolInput>({
    resolver: zodResolver(requestCarpoolSchema),
    defaultValues: { carpoolId, message: "" },
  });

  // 드라이버 본인에게는 폼을 노출하지 않음
  if (currentUserId === driverId) {
    return null;
  }

  // 이미 신청한 경우 신청 상태만 표시
  if (existingRequest !== null) {
    return (
      <CarpoolRequestStatus
        request={existingRequest}
        eventId={eventId}
        showCancel={showCancel}
      />
    );
  }

  // 좌석이 모두 찬 경우
  const isFull = approvedCount >= totalSeats;

  const onSubmit = (data: RequestCarpoolInput) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("carpoolId", data.carpoolId);
      formData.set("message", data.message ?? "");
      const result = await requestCarpool(formData);
      if (result.success) {
        toast.success("카풀 탑승 신청이 완료되었습니다.");
        form.reset();
      } else if (result.errorCode === "CARPOOL_CONFLICT") {
        setConflictMessage(result.error ?? "카풀 참여 제한에 걸렸습니다.");
      } else {
        toast.error(result.error ?? "신청에 실패했습니다.");
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {/* 메시지 입력 (선택) */}
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>메시지 (선택)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="드라이버에게 전달할 메시지를 입력해주세요..."
                    rows={3}
                    maxLength={200}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 신청 버튼 영역 */}
          <div className="flex items-center justify-between">
            {isFull && <Badge variant="destructive">마감</Badge>}
            <Button
              type="submit"
              disabled={isPending || isFull}
              className="ml-auto"
            >
              <Send className="mr-2 h-4 w-4" />
              {isPending ? "신청 중..." : "탑승 신청"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
