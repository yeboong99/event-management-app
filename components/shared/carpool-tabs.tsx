"use client";

import { Car, Pencil, X } from "lucide-react";
import { useState } from "react";

import { CarpoolRegisterForm } from "@/components/forms/carpool-register-form";
import { CarpoolRequestForm } from "@/components/forms/carpool-request-form";
import { CarpoolUpdateForm } from "@/components/forms/carpool-update-form";
import {
  CarpoolActions,
  CarpoolDeleteButton,
} from "@/components/shared/carpool-actions";
import { CarpoolCard } from "@/components/shared/carpool-card";
import { CarpoolRegisterToggle } from "@/components/shared/carpool-register-toggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  CarpoolRequestWithCarpool,
  CarpoolRequestWithProfile,
  CarpoolWithDetails,
} from "@/types/carpool";

interface CarpoolTabsProps {
  eventId: string;
  currentUserId: string;
  isHost: boolean;
  isApproved: boolean;
  canRegister: boolean;
  // 본인 카풀이 앞에 오도록 정렬된 전체 카풀 목록
  carpools: CarpoolWithDetails[];
  // 드라이버/주최자 카풀의 탑승 신청 목록 (carpoolId → requests)
  requestsRecord: Record<string, CarpoolRequestWithProfile[]>;
  // 현재 사용자가 신청한 카풀 목록 (이 이벤트 한정)
  myRequestsForEvent: CarpoolRequestWithCarpool[];
}

export function CarpoolTabs({
  eventId,
  currentUserId,
  isHost,
  isApproved,
  canRegister,
  carpools,
  requestsRecord,
  myRequestsForEvent,
}: CarpoolTabsProps) {
  // 카풀 등록 폼 열림 상태 — CarpoolRegisterToggle과 CarpoolRegisterForm이 공유
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  // 수정 폼 열림 상태 — 카풀별로 독립적으로 관리 (carpoolId → boolean)
  const [openUpdateFormId, setOpenUpdateFormId] = useState<string | null>(null);

  // "내 카풀": 내가 드라이버이거나 탑승 신청한 카풀
  const myCarpools = carpools.filter(
    (c) =>
      c.driver_id === currentUserId ||
      myRequestsForEvent.some((r) => r.carpool_id === c.id),
  );

  const renderCarpoolList = (list: CarpoolWithDetails[], isMineTab = false) => {
    if (list.length === 0) {
      return (
        <div className="py-12 text-center">
          <Car className="text-muted-foreground/50 mx-auto mb-3 h-12 w-12" />
          <p className="text-muted-foreground text-sm">
            {isMineTab
              ? "등록하거나 신청한 카풀이 없습니다."
              : "등록된 카풀이 없습니다."}
          </p>
          {!isMineTab && canRegister && (
            <p className="text-muted-foreground mt-1 text-xs">
              위 버튼을 눌러 카풀을 등록해보세요.
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {list.map((carpool) => {
          const isDriver = carpool.driver_id === currentUserId;
          const isDriverOrHost = isDriver || isHost;
          const requests = requestsRecord[carpool.id] ?? [];
          const existingRequest =
            myRequestsForEvent.find((r) => r.carpool_id === carpool.id) ?? null;

          return (
            <CarpoolCard
              key={carpool.id}
              carpool={carpool}
              headerAction={
                isDriverOrHost ? (
                  <div className="flex items-center gap-1">
                    {/* 수정 버튼 — 드라이버 본인에게만 표시 */}
                    {isDriver && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setOpenUpdateFormId((prev) =>
                            prev === carpool.id ? null : carpool.id,
                          )
                        }
                        aria-label="카풀 수정"
                        aria-expanded={openUpdateFormId === carpool.id}
                      >
                        {openUpdateFormId === carpool.id ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Pencil className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {/* 삭제 버튼 — 드라이버 또는 주최자에게 표시 */}
                    <CarpoolDeleteButton
                      carpoolId={carpool.id}
                      eventId={eventId}
                    />
                  </div>
                ) : undefined
              }
            >
              {/* 카풀 수정 폼 — 드라이버 본인이 수정 버튼 클릭 시 인라인으로 표시 */}
              {isDriver && openUpdateFormId === carpool.id && (
                <div className="border-border rounded-lg border p-4">
                  <CarpoolUpdateForm
                    carpoolId={carpool.id}
                    eventId={eventId}
                    defaultValues={{
                      departurePlace: carpool.departure_place,
                      departureTime: carpool.departure_time,
                      totalSeats: carpool.total_seats,
                      description: carpool.description,
                    }}
                    approvedCount={carpool.approved_count}
                    onSuccess={() => setOpenUpdateFormId(null)}
                  />
                </div>
              )}

              {/* 드라이버 또는 주최자: 탑승 신청 관리 액션 */}
              {isDriverOrHost && (
                <CarpoolActions
                  carpool={carpool}
                  requests={requests}
                  currentUserId={currentUserId}
                  eventId={eventId}
                  isDriverOrHost={isDriverOrHost}
                />
              )}

              {/* 승인된 참여자(드라이버 제외): 탑승 신청 폼 */}
              {isApproved && !isDriver && (
                <CarpoolRequestForm
                  carpoolId={carpool.id}
                  totalSeats={carpool.total_seats}
                  approvedCount={carpool.approved_count}
                  currentUserId={currentUserId}
                  driverId={carpool.driver_id}
                  existingRequest={existingRequest}
                  eventId={eventId}
                  showCancel={isMineTab}
                />
              )}
            </CarpoolCard>
          );
        })}
      </div>
    );
  };

  return (
    <Tabs defaultValue="list" className="space-y-4">
      {/* 헤더 행: 탭 목록 + "카풀 만들기" 토글 버튼 */}
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="list">
            카풀 목록
            {carpools.length > 0 && (
              <span className="bg-primary/15 text-primary ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-medium">
                {carpools.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="mine">
            내 카풀
            {myCarpools.length > 0 && (
              <span className="bg-primary/15 text-primary ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-medium">
                {myCarpools.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        {canRegister && (
          <CarpoolRegisterToggle
            isOpen={isRegisterOpen}
            onToggle={() => setIsRegisterOpen((prev) => !prev)}
          />
        )}
      </div>

      {/* 카풀 등록 폼 — 헤더와 탭 콘텐츠 사이에 전체 너비로 배치 */}
      {isRegisterOpen && (
        <div className="border-border rounded-lg border p-4">
          <CarpoolRegisterForm
            eventId={eventId}
            onSuccess={() => setIsRegisterOpen(false)}
          />
        </div>
      )}

      <TabsContent value="list">
        {renderCarpoolList(carpools, false)}
      </TabsContent>

      <TabsContent value="mine">
        {renderCarpoolList(myCarpools, true)}
      </TabsContent>
    </Tabs>
  );
}
