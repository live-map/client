/**
 * 소유권 검증 결과 타입
 */
export interface OwnershipResult<T> {
  data: T | null;
  error?: string;
}

// TODO: Implement verifyItemOwnership via backend API
