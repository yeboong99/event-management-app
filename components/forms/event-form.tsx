"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createEvent, updateEvent } from "@/actions/events";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { eventCreateSchema } from "@/lib/validations/event";
import { validateImageFile } from "@/lib/validations/image";
import {
  EVENT_CATEGORIES,
  type EventCategory,
  type EventFormData,
} from "@/types/event";

// 카테고리 한국어 라벨 매핑
const CATEGORY_LABELS: Record<string, string> = {
  conference: "컨퍼런스",
  workshop: "워크숍",
  seminar: "세미나",
  meetup: "밋업",
  concert: "콘서트",
  exhibition: "전시회",
  sports: "스포츠",
  networking: "네트워킹",
  other: "기타",
};

// 컴포넌트 Props 타입
type EventFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<EventFormData>;
  eventId?: string;
};

export function EventForm({ mode, defaultValues, eventId }: EventFormProps) {
  // 이미지 미리보기 상태
  const [imagePreview, setImagePreview] = useState<string | null>(
    defaultValues?.coverImageUrl || null,
  );

  // 비동기 전환 상태 (제출 중 로딩 표시용)
  const [isPending, startTransition] = useTransition();

  // React Hook Form 연결
  // zodResolver를 any로 캐스팅하여 isPublic boolean/undefined 타입 불일치 해소
  // (Zod의 .default(true)로 인해 스키마 추론 타입과 EventFormData 타입이 미세하게 다름)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(eventCreateSchema) as any,
    defaultValues: {
      isPublic: true,
      ...defaultValues,
    },
  });

  // 공개 여부 필드 실시간 감시
  const isPublic = watch("isPublic");

  // 이미지 파일 변경 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 클라이언트 사이드 파일 검증
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      e.target.value = "";
      return;
    }

    // FileReader로 미리보기 URL 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 폼 제출 핸들러
  const onSubmit = (data: EventFormData) => {
    startTransition(async () => {
      // FormData 구성 (Server Action으로 전달)
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("category", data.category);
      formData.append("eventDate", data.eventDate);
      formData.append("isPublic", String(data.isPublic));

      if (data.description) formData.append("description", data.description);
      if (data.location) formData.append("location", data.location);
      if (data.maxParticipants)
        formData.append("maxParticipants", String(data.maxParticipants));

      // 커버 이미지 파일 첨부
      const fileInput = document.querySelector(
        'input[name="coverImage"]',
      ) as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append("coverImage", fileInput.files[0]);
      }

      try {
        if (mode === "create") {
          await createEvent(formData);
        } else if (mode === "edit" && eventId) {
          await updateEvent(eventId, formData);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "오류가 발생했습니다",
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* 제목 필드 */}
      <div>
        <Label htmlFor="title">
          제목 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="이벤트 제목을 입력하세요"
          className="mt-1.5"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-destructive mt-1 text-sm">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* 카테고리 필드 */}
      <div>
        <Label htmlFor="category">
          카테고리 <span className="text-destructive">*</span>
        </Label>
        <Select
          onValueChange={(value) =>
            setValue("category", value as EventCategory)
          }
          defaultValue={defaultValues?.category}
        >
          <SelectTrigger id="category" className="mt-1.5 w-full">
            <SelectValue placeholder="카테고리를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {CATEGORY_LABELS[category] ?? category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-destructive mt-1 text-sm">
            {errors.category.message}
          </p>
        )}
      </div>

      {/* 일시 필드 */}
      <div className="overflow-hidden">
        <Label htmlFor="eventDate">
          일시 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="eventDate"
          type="datetime-local"
          className="mt-1.5 w-full max-w-full"
          defaultValue={defaultValues?.eventDate}
          {...register("eventDate")}
        />
        {errors.eventDate && (
          <p className="text-destructive mt-1 text-sm">
            {errors.eventDate.message}
          </p>
        )}
      </div>

      {/* 장소 필드 */}
      <div>
        <Label htmlFor="location">장소</Label>
        <Input
          id="location"
          placeholder="장소를 입력하세요"
          className="mt-1.5"
          {...register("location")}
        />
        {errors.location && (
          <p className="text-destructive mt-1 text-sm">
            {errors.location.message}
          </p>
        )}
      </div>

      {/* 최대 참여자 수 필드 */}
      <div>
        <Label htmlFor="maxParticipants">최대 참여자 수</Label>
        <Input
          id="maxParticipants"
          type="number"
          min="1"
          max="999"
          placeholder="제한 없음"
          className="mt-1.5"
          {...register("maxParticipants", {
            setValueAs: (v) => (v === "" ? undefined : Number(v)),
          })}
        />
        {errors.maxParticipants && (
          <p className="text-destructive mt-1 text-sm">
            {errors.maxParticipants.message}
          </p>
        )}
      </div>

      {/* 설명 필드 */}
      <div>
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          rows={4}
          placeholder="이벤트에 대해 설명해주세요"
          className="mt-1.5 resize-none"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-destructive mt-1 text-sm">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* 커버 이미지 필드 */}
      <div>
        <Label htmlFor="coverImage">커버 이미지</Label>
        <Input
          id="coverImage"
          type="file"
          name="coverImage"
          accept="image/jpeg,image/png,image/webp"
          className="mt-1.5 cursor-pointer"
          onChange={handleImageChange}
        />
        {/* 이미지 미리보기 */}
        {imagePreview !== null && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="커버 이미지 미리보기"
              className="h-40 w-full rounded-md object-cover"
            />
          </div>
        )}
        <p className="text-muted-foreground mt-1 text-sm">
          JPG, PNG, WebP 형식 / 최대 5MB
        </p>
        {errors.coverImageUrl && (
          <p className="text-destructive mt-1 text-sm">
            {errors.coverImageUrl.message}
          </p>
        )}
      </div>

      {/* 공개/비공개 필드 */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="isPublic"
          checked={isPublic}
          onCheckedChange={(checked) =>
            setValue("isPublic", checked as boolean)
          }
        />
        <Label
          htmlFor="isPublic"
          className="cursor-pointer text-sm font-normal"
        >
          이벤트를 공개로 설정합니다
        </Label>
      </div>

      {/* 제출 버튼 */}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {mode === "create" ? "생성 중..." : "수정 중..."}
          </>
        ) : mode === "create" ? (
          "이벤트 만들기"
        ) : (
          "수정 완료"
        )}
      </Button>
    </form>
  );
}
