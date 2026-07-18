# 백엔드 SDD 워크플로우

이 프로젝트는 Paul Everitt의 강의 흐름을 백엔드에 맞게 적용한다.

## 1. Constitution

`specs/constitution.md`에서 프로젝트의 불변 원칙을 확인한다. 기능을
시작하기 전에 명세가 이 원칙을 어기지 않는지 점검한다.

## 2. Feature Spec

`specs/features/<feature-name>/requirements.md`를 작성한다. 무엇을
만드는지, 왜 필요한지, 어떤 동작이 성공인지 먼저 정한다.

## 3. Implementation

`plan.md`와 `implementation.md`를 작성한 뒤 구현한다. 구현 중 새로운
결정이 생기면 문서를 먼저 업데이트한다.

## 4. Validation

`validation.md`에 테스트 명령, 수동 검증 절차, 확인 결과를 남긴다.
검증 전에는 기능을 완료로 보지 않는다.

## 5. Replanning

기능이 커지거나 가정이 틀리면 `replanning.md`에 변경 이유와 새 계획을
남긴다. 계획 변경은 실패가 아니라 명세를 살아 있게 만드는 과정이다.

## 6. Legacy Support

기존 코드 변경은 `legacy-support.md`에 현재 동작, 보존할 호환성,
마이그레이션 전략을 기록한다.

## 7. Build Your Own Workflow

반복되는 작업은 이 워크플로우를 프로젝트에 맞게 개선한다. 새 규칙은
constitution 또는 템플릿에 반영한다.
