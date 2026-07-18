# 프론트엔드 SDD 워크플로우

이 프로젝트는 Paul Everitt의 강의 흐름을 프론트엔드에 맞게 적용한다.

## 1. Constitution

`specs/constitution.md`에서 프로젝트의 불변 원칙을 확인한다. 화면을
만들기 전에 사용자 흐름, API 계약, 검증 기준이 원칙과 맞는지 점검한다.

## 2. Feature Spec

`specs/features/<feature-name>/requirements.md`를 작성한다. 사용자가 어떤
일을 끝내야 하는지, 어떤 화면 상태가 필요한지 먼저 정한다.

## 3. Implementation

`plan.md`와 `implementation.md`를 작성한 뒤 구현한다. 구현 중 새 화면
상태나 API 가정이 생기면 문서를 먼저 업데이트한다.

## 4. Validation

`validation.md`에 lint, 빌드, 화면 확인 절차, API 실패 상태 확인 결과를
남긴다.

## 5. Replanning

화면 흐름이 커지거나 API 계약이 바뀌면 `replanning.md`에 변경 이유와
새 계획을 남긴다.

## 6. Legacy Support

기존 화면을 바꿀 때는 `legacy-support.md`에 현재 동작, 유지할 호환성,
사용자 영향, 회귀 검증 방법을 기록한다.

## 7. Build Your Own Workflow

반복되는 작업은 이 워크플로우를 프로젝트에 맞게 개선한다. 새 규칙은
constitution 또는 템플릿에 반영한다.
