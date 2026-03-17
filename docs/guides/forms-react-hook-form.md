# 폼 처리 가이드

> React Hook Form + Zod + Server Actions를 활용한 최적의 폼 처리 패턴

## 의존성

```bash
npm install react-hook-form @hookform/resolvers zod
```

## 기본 구조

폼 처리의 3가지 핵심 요소:

1. **Zod 스키마** (`lib/validations/`) - 유효성 검증 규칙 정의
2. **Server Action** (`actions/`) - 서버 사이드 데이터 처리
3. **폼 컴포넌트** (`components/forms/`) - UI + 클라이언트 검증

## Zod 스키마 정의

### 기본 스키마

```tsx
// lib/validations/event.ts
import { z } from "zod";

export const eventFormSchema = z.object({
  title: z
    .string()
    .min(1, "제목을 입력해주세요")
    .max(100, "제목은 100자 이내로 입력해주세요"),
  description: z
    .string()
    .min(10, "설명은 최소 10자 이상 입력해주세요")
    .max(1000, "설명은 1000자 이내로 입력해주세요"),
  date: z.string().min(1, "날짜를 선택해주세요"),
  location: z.string().min(1, "장소를 입력해주세요"),
  maxParticipants: z
    .number({ invalid_type_error: "숫자를 입력해주세요" })
    .int("정수를 입력해주세요")
    .min(1, "최소 1명 이상이어야 합니다")
    .max(10000, "최대 10,000명까지 가능합니다"),
  isPublic: z.boolean().default(true),
});

// 타입 추출 (폼과 서버 양쪽에서 사용)
export type EventFormData = z.infer<typeof eventFormSchema>;
```

### 고급 스키마 패턴

```tsx
// 조건부 검증 (refine)
export const signUpSchema = z
  .object({
    email: z.string().email("올바른 이메일을 입력해주세요"),
    password: z
      .string()
      .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
      .regex(/[A-Z]/, "대문자를 포함해야 합니다")
      .regex(/[0-9]/, "숫자를 포함해야 합니다"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

// 선택적 필드
export const profileSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  bio: z.string().max(200).optional(),
  website: z
    .string()
    .url("올바른 URL을 입력해주세요")
    .optional()
    .or(z.literal("")),
});
```

## Server Action 정의

### Action 반환 타입 표준화

```tsx
// types/index.ts
export type ActionState<T = void> = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
};
```

### Server Action 작성

```tsx
// actions/events.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eventFormSchema } from "@/lib/validations/event";
import type { ActionState } from "@/types";

export async function createEvent(
  prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  // 1. 서버 사이드 유효성 검증 (클라이언트 검증과 동일한 스키마 재사용)
  const rawData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    date: formData.get("date") as string,
    location: formData.get("location") as string,
    maxParticipants: Number(formData.get("maxParticipants")),
    isPublic: formData.get("isPublic") === "on",
  };

  const validated = eventFormSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  // 2. 인증 확인
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  // 3. 데이터 저장
  const { error } = await supabase
    .from("events")
    .insert({ ...validated.data, user_id: user.id });

  if (error) {
    return { success: false, message: "이벤트 생성에 실패했습니다." };
  }

  // 4. 캐시 무효화 & 리다이렉트
  revalidatePath("/events");
  redirect("/events");
}
```

## 폼 컴포넌트 패턴

### 패턴 1: React Hook Form + Server Action (권장)

클라이언트 검증(즉각적 피드백) + 서버 검증(보안)을 결합한 패턴:

```tsx
// components/forms/event-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useRef, useEffect } from "react";
import { eventFormSchema, type EventFormData } from "@/lib/validations/event";
import { createEvent } from "@/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EventForm() {
  const [state, action, isPending] = useActionState(createEvent, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      location: "",
      maxParticipants: 100,
      isPublic: true,
    },
  });

  // 서버 에러를 폼에 반영
  useEffect(() => {
    if (state?.errors) {
      Object.entries(state.errors).forEach(([field, messages]) => {
        if (messages?.[0]) {
          setError(field as keyof EventFormData, { message: messages[0] });
        }
      });
    }
  }, [state?.errors, setError]);

  // 클라이언트 검증 통과 후 Server Action 실행
  const onSubmit = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit(onSubmit)}>
      {state?.message && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input id="title" {...register("title")} />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">설명</Label>
          <textarea
            id="description"
            className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="date">날짜</Label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxParticipants">최대 참가 인원</Label>
            <Input
              id="maxParticipants"
              type="number"
              {...register("maxParticipants", { valueAsNumber: true })}
            />
            {errors.maxParticipants && (
              <p className="text-sm text-destructive">
                {errors.maxParticipants.message}
              </p>
            )}
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "생성 중..." : "이벤트 생성"}
        </Button>
      </div>
    </form>
  );
}
```

### 패턴 2: useActionState 단독 사용 (단순 폼)

간단한 폼에서는 React Hook Form 없이 useActionState만 사용:

```tsx
"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, action, isPending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input id="email" name="email" type="email" required />
        {state?.errors?.email && (
          <p className="text-sm text-destructive">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input id="password" name="password" type="password" required />
        {state?.errors?.password && (
          <p className="text-sm text-destructive">{state.errors.password[0]}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "로그인 중..." : "로그인"}
      </Button>
    </form>
  );
}
```

## 수정 폼 패턴 (기존 데이터 편집)

```tsx
// app/events/[id]/edit/page.tsx (Server Component)
import { getEvent } from "@/lib/data/events";
import { EventEditForm } from "@/components/forms/event-edit-form";
import { notFound } from "next/navigation";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return <EventEditForm event={event} />;
}
```

```tsx
// components/forms/event-edit-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useRef, useEffect } from "react";
import { eventFormSchema, type EventFormData } from "@/lib/validations/event";
import { updateEvent } from "@/actions/events";

type EventEditFormProps = {
  event: EventFormData & { id: string };
};

export function EventEditForm({ event }: EventEditFormProps) {
  // Server Action에 id를 bind
  const updateEventWithId = updateEvent.bind(null, event.id);
  const [state, action, isPending] = useActionState(
    updateEventWithId,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setError,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      maxParticipants: event.maxParticipants,
      isPublic: event.isPublic,
    },
  });

  useEffect(() => {
    if (state?.errors) {
      Object.entries(state.errors).forEach(([field, messages]) => {
        if (messages?.[0]) {
          setError(field as keyof EventFormData, { message: messages[0] });
        }
      });
    }
  }, [state?.errors, setError]);

  const onSubmit = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit(onSubmit)}>
      {/* ...폼 필드들 (생성 폼과 동일한 구조) */}
      <Button type="submit" disabled={isPending || !isDirty}>
        {isPending ? "저장 중..." : "변경사항 저장"}
      </Button>
    </form>
  );
}
```

## 동적 폼 필드

```tsx
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";

const scheduleSchema = z.object({
  eventName: z.string().min(1, "이벤트명을 입력해주세요"),
  sessions: z
    .array(
      z.object({
        time: z.string().min(1, "시간을 입력해주세요"),
        topic: z.string().min(1, "주제를 입력해주세요"),
        speaker: z.string().optional(),
      }),
    )
    .min(1, "최소 1개의 세션이 필요합니다"),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

export function ScheduleForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      eventName: "",
      sessions: [{ time: "", topic: "", speaker: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "sessions",
  });

  return (
    <form onSubmit={handleSubmit(console.log)} className="space-y-6">
      <div className="space-y-2">
        <Label>이벤트명</Label>
        <Input {...register("eventName")} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>세션 목록</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ time: "", topic: "", speaker: "" })}
          >
            <Plus className="mr-1 h-4 w-4" />
            세션 추가
          </Button>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-start gap-2 rounded-lg border p-4"
          >
            <div className="flex-1 space-y-2">
              <Input
                placeholder="시간"
                {...register(`sessions.${index}.time`)}
              />
              {errors.sessions?.[index]?.time && (
                <p className="text-sm text-destructive">
                  {errors.sessions[index].time.message}
                </p>
              )}
              <Input
                placeholder="주제"
                {...register(`sessions.${index}.topic`)}
              />
              <Input
                placeholder="발표자 (선택)"
                {...register(`sessions.${index}.speaker`)}
              />
            </div>
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button type="submit">저장</Button>
    </form>
  );
}
```

## 패턴 선택 기준

| 상황                                   | 권장 패턴                          |
| -------------------------------------- | ---------------------------------- |
| 간단한 폼 (2~3개 필드)                 | `useActionState` 단독              |
| 복잡한 폼 (4개 이상 필드, 실시간 검증) | React Hook Form + `useActionState` |
| 동적 필드 (추가/삭제)                  | React Hook Form `useFieldArray`    |
| 다단계 폼 (wizard)                     | React Hook Form + 상태 관리        |
| 파일 업로드 포함                       | `useActionState` + FormData        |

## 핵심 원칙

1. **이중 검증**: 클라이언트(UX)와 서버(보안) 양쪽 모두 Zod 스키마로 검증
2. **스키마 재사용**: `lib/validations/`에 정의한 스키마를 클라이언트와 서버에서 공유
3. **Server Action 우선**: 데이터 변경은 반드시 Server Action을 통해 수행
4. **에러 표시 일관성**: 모든 폼에서 동일한 에러 표시 패턴 사용
5. **접근성**: `Label`과 `Input`을 `htmlFor`/`id`로 연결, 에러 메시지 제공
6. **로딩 상태**: `isPending`으로 중복 제출 방지 및 사용자 피드백 제공
