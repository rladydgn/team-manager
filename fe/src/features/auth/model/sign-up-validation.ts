export type SignUpField = "name" | "birthYear" | "username" | "password" | "email";

export type SignUpFormValues = Record<SignUpField, string>;

export type SignUpFieldErrors = Partial<Record<SignUpField, string>>;

const USERNAME_REGEX = /^[a-z0-9_-]{5,20}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]:";'<>?,./]).{8,20}$/;
const BIRTH_YEAR_REGEX = /^\d{4}$/;
const MIN_BIRTH_YEAR = 1900;
const CURRENT_YEAR = new Date().getFullYear();

export function validateSignUpField(
  field: SignUpField,
  value: string
): string | undefined {
  if (field === "name") {
    const trimmedName = value.trim();

    if (trimmedName.length === 0) {
      return "이름을 입력해 주세요.";
    }

    if (trimmedName.length > 50) {
      return "이름은 공백을 제외하고 50자 이하로 입력해 주세요.";
    }

    return undefined;
  }

  if (field === "email") {
    return value.trim().length > 0 ? undefined : "이메일을 입력해 주세요.";
  }

  if (field === "birthYear") {
    const birthYear = Number(value);

    return BIRTH_YEAR_REGEX.test(value) &&
      birthYear >= MIN_BIRTH_YEAR &&
      birthYear <= CURRENT_YEAR
      ? undefined
      : `${MIN_BIRTH_YEAR}년부터 ${CURRENT_YEAR}년 사이의 출생연도를 입력해 주세요.`;
  }

  if (field === "username") {
    return USERNAME_REGEX.test(value)
      ? undefined
      : "아이디는 영문 소문자, 숫자, 하이픈(-), 밑줄(_)만 사용한 5~20자여야 합니다.";
  }

  return PASSWORD_REGEX.test(value)
    ? undefined
    : "비밀번호는 영문, 숫자, 특수문자를 모두 포함한 8~20자여야 합니다.";
}

export function validateSignUp(values: SignUpFormValues): SignUpFieldErrors {
  return Object.fromEntries(
    (Object.keys(values) as SignUpField[])
      .map((field) => [field, validateSignUpField(field, values[field])] as const)
      .filter(([, error]) => error !== undefined)
  ) as SignUpFieldErrors;
}
