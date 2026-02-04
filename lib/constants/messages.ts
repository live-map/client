/**
 * 에러 메시지 상수
 * 일관된 에러 메시지를 위한 중앙화된 메시지 정의
 */

export const ERROR_MESSAGES = {
  // 인증/인가 관련
  UNAUTHORIZED: "로그인이 필요합니다.",
  ACCESS_DENIED: "접근 권한이 없습니다.",
  NOT_OWNER: "이 리소스의 소유자만 접근할 수 있습니다.",
  EMAIL_PASSWORD_REQUIRED: "이메일과 비밀번호를 입력해주세요.",
  INVALID_CREDENTIALS: "이메일 또는 비밀번호가 올바르지 않습니다.",
  SIGNIN_ERROR: "로그인 중 오류가 발생했습니다.",
  ALL_FIELDS_REQUIRED: "모든 필드를 입력해주세요.",
  PASSWORD_MISMATCH: "비밀번호가 일치하지 않습니다.",
  PASSWORD_TOO_SHORT: "비밀번호는 8자 이상이어야 합니다.",
  EMAIL_ALREADY_EXISTS: "이미 사용 중인 이메일입니다.",
  SIGNUP_LOGIN_FAILED: "회원가입은 완료되었으나 로그인에 실패했습니다.",

  // 리소스 관련 (일반)
  NOT_FOUND: (resource: string) => `${resource}을(를) 찾을 수 없습니다.`,

  // 리소스 관련 (아이템)
  ITEM_NOT_FOUND: "아이템을 찾을 수 없습니다.",

  // 입력 검증 관련
  INVALID_INPUT: "입력값이 유효하지 않습니다.",
  REQUIRED_FIELD: (field: string) => `${field}은(는) 필수 항목입니다.`,
  TITLE_REQUIRED: "제목을 입력해주세요.",

  // 권한 관련
  ITEM_OWNER_ONLY: "아이템의 소유자만 이 작업을 수행할 수 있습니다.",

  // 서버 오류
  SERVER_ERROR: "서버 오류가 발생했습니다.",
  REQUEST_ERROR: "요청 처리 중 오류가 발생했습니다.",

  // 여론조사 관련
  POLL_NOT_FOUND: "여론조사를 찾을 수 없습니다.",
  POLL_OWNER_ONLY: "여론조사의 작성자만 이 작업을 수행할 수 있습니다.",
  POLL_NOT_ACTIVE: "투표가 진행 중이지 않습니다.",
  POLL_ALREADY_VOTED: "이미 투표하셨습니다.",
  POLL_OPTION_NOT_FOUND: "선택지를 찾을 수 없습니다.",
  POLL_OPTION_INVALID: "유효하지 않은 선택지입니다.",
  POLL_MIN_OPTIONS: "최소 2개의 선택지가 필요합니다.",
  POLL_MAX_OPTIONS: "선택지는 최대 10개까지 추가할 수 있습니다.",
} as const;

export const SUCCESS_MESSAGES = {
  // 생성
  CREATED: (resource: string) => `${resource}이(가) 생성되었습니다.`,

  // 수정
  UPDATED: (resource: string) => `${resource}이(가) 수정되었습니다.`,

  // 삭제
  DELETED: (resource: string) => `${resource}이(가) 삭제되었습니다.`,

  // 여론조사
  VOTE_SUCCESS: "투표가 완료되었습니다.",
  POLL_CREATED: "여론조사 제안이 등록되었습니다.",
} as const;
