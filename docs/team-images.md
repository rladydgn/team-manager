# 팀 홈 이미지

작성일: 2026-10-29 · 갱신일: 2026-10-30 · 상태: **사용자 검토·정책 확정, 구현·로컬 검증 완료. 실제 MySQL·운영 적용은 미실행.**

## 확정된 사용자 요구

- 팀 메인 화면에 이미지를 등록하고 노출한다.
- 운영진(기존 역할의 팀장·부팀장)이 팀별 최대 3장까지 등록한다.
- jpg만 허용하고 파일마다 5MB 이하로 제한한다. 구현 기준은 기존 바이너리 용량 표기에 맞춰 5,242,880바이트 이하로 제안한다.
- 서버 사용자 홈의 `~/files` 하위에 보관하고 이미지 경로를 DB에 저장·조회한다.
- 테이블 구조는 구현 전 사용자 검토를 받는다. 결정 사항은 질문한다. 완료 작업은 단위별로 커밋한다.
- 2026-10-30 원본 파일명을 별도 저장하는 구조를 검토받았다. 사용자는 업로드·삭제만 제공하는 단순 구조에 동의했고, 이후 순서 설정도 요청해 `sort_order`만 추가했다. `updated_at`·`updated_by_user_id`는 추가하지 않았다.
- 이미지 목록·파일은 **비로그인 포함 공개**로 확정했다. 공개 조회는 만료된 로그인 쿠키가 있어도 가능하며 쓰기는 인증된 운영진에게만 허용한다.
- 삭제는 `deleted_at`으로 처리하고 파일과 행은 보관한다. 일반 목록·파일 API에서는 즉시 제외하며 별도 복구·영구 삭제 기능은 제공하지 않는다.

## 확정 테이블

기존 팀 로고와 분리한 `team_images`. [schema.sql](../be/src/main/resources/schema.sql)과 [change_schema.sql](../be/src/main/resources/change_schema.sql) 마지막 `Team images (2026-10-30)` 블록에 반영했다. 기존 DB에서는 해당 미적용 블록만 검토하고 누적 파일 전체를 실행하지 않는다. 실제 DB에는 실행하지 않았다.

```sql
CREATE TABLE team_images (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    team_id BIGINT UNSIGNED NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    file_size_bytes INT UNSIGNED NOT NULL,
    created_by_user_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_team_images_team_deleted_order (team_id, deleted_at, sort_order, id)
);
```

`image_path`는 **`~/files/` 기준 상대 경로**다. 팀 ID가 123이고 업로드한 파일 이름이 `가을 친선전.jpg`라면 다음처럼 저장한다.

| 항목 | 예시 |
| --- | --- |
| DB `original_file_name` | `가을 친선전.jpg` |
| DB `image_path` | `team-images/123/550e8400-e29b-41d4-a716-446655440000.jpg` |
| 실제 파일 | `~/files/team-images/123/550e8400-e29b-41d4-a716-446655440000.jpg` |
| Windows 사용자 홈 예시 | `C:/Users/dhdgn/files/team-images/123/550e8400-e29b-41d4-a716-446655440000.jpg` |
| Linux 사용자 홈 예시 | `/home/app/files/team-images/123/550e8400-e29b-41d4-a716-446655440000.jpg` |

물리 파일은 **백엔드 실행 계정**의 사용자 홈(`user.home`) 아래 `files/`에 상대 경로를 붙여 찾는다. 위 OS 경로는 예시이며 배포 계정의 홈에 따라 달라진다. 셸의 `~` 문자열을 그대로 Path로 사용하지 않는다. DB 경로에는 `~/files/`, 절대 경로 또는 공개 API URL을 넣지 않는다. 따라서 저장 루트가 달라져도 상대 경로와 파일을 함께 옮겨 사용할 수 있다.

`original_file_name`은 업로드 파일의 이름 보관용이며 실제 파일 경로나 URL을 만드는 데 사용하지 않는다. 브라우저가 경로를 포함해 보내면 파일명 부분만 보관하고 제어 문자·길이를 검증한다. 같은 원본 이름으로 올려도 각 파일은 다른 UUID로 저장해 덮어쓰지 않는다. 조회 API는 DB에서 활성 행을 찾고 이미지 ID 기반 URL을 제공하며 파일도 그 행을 통해 조회한다.

기존 지침대로 UNIQUE/FK/CHECK는 추가하지 않았다. 같은 팀의 업로드·삭제·순서 변경은 팀 행 잠금과 트랜잭션으로 직렬화한다. 잠금 뒤 운영진 소속과 현재 이미지 목록을 잠금 조회해 MySQL REPEATABLE READ에서도 오래된 일반 조회에 의존해 3장을 초과하지 않도록 했다. 실제 MySQL 동시성 검증은 별도로 남는다. 업로드는 현재 순서의 끝에 추가하고 조회는 `sort_order, id` 오름차순이다.

## 파일 처리와 한도

- FE와 BE가 모두 `.jpg` 확장자(대소문자 허용), `image/jpeg`, 0바이트 초과·5,242,880바이트 이하를 검사한다. `.jpeg`·PNG·다른 확장자는 거절한다. BE는 헤더 형식뿐 아니라 실제 JPEG 디코딩도 검사한다. 픽셀이 큰 파일은 샘플링해서 검증 메모리를 제한하고 원본 바이트·비율을 그대로 보관한다.
- `TeamImageStorage`의 기본 루트는 `${user.home}/files`다. 격리 테스트는 `app.team-image.storage-path`에 임시 루트를 주입할 수 있다. 기존 로고 저장 폴더는 옮기지 않는다.
- 한 번에 한 장을 `image` multipart 파트로 보낸다. 앱의 공통 multipart 한도는 파일 5MB/전체 요청 6MB로 조정했다. **로고 자체의 1MB·PNG/JPG·크기 검증은 유지**한다. 프록시·배포·볼륨 설정은 변경하지 않았다.
- 신규 파일 저장·DB 쓰기가 실패하면 신규 파일을 정리한다. DB 트랜잭션 완료 콜백으로 롤백 파일도 정리한다. 실패 정리 중 파일 시스템 오류는 로그에 기록된다.
- 삭제 시 파일은 보관하므로 저장 공간은 누적된다. DB와 파일이 서로 짝을 이루며, 보관 정책 없는 자동 파일 삭제는 하지 않는다. 이미 사용자가 내려받은 파일까지 회수할 수 있다는 뜻은 아니다.

## API

| API | 권한·응답 |
| --- | --- |
| `GET /teams/{teamId}/images` | 공개, 활성 이미지 배열 |
| `GET /teams/{teamId}/images/{imageId}/file` | 공개, DB 행과 팀이 유효하면 JPG 바이트 |
| `POST /teams/{teamId}/images` | 운영진, multipart `image` 한 장, 저장 후 전체 배열 |
| `DELETE /teams/{teamId}/images/{imageId}` | 운영진, 소프트 삭제 후 전체 배열 |
| `PUT /teams/{teamId}/images/order` | 운영진, 전체 순서 검증·저장 후 전체 배열 |

목록 항목은 `id`, `url`, `originalFileName`, `fileSizeBytes`, `createdAt`을 제공한다. `url` 예: `/teams/123/images/456/file`. 내부 저장 경로·등록자 ID는 공개 응답에 포함하지 않는다. 파일 조회는 DB를 확인해 삭제 이미지·다른 팀의 이미지·삭제/비활성 팀을 거절한다. 파일과 목록 응답은 `Cache-Control: no-store`, 파일은 `image/jpeg`·`nosniff`를 제공한다.

순서 변경 예:

```json
{"imageIds":[456,123],"expectedImageIds":[123,456]}
```

`expectedImageIds`가 현재 순서와 다르면 409 `TEAM_IMAGES_CHANGED`다. 새 순서는 현재 활성 이미지 전부를 중복 없이 포함해야 한다. 업로드/삭제로 목록이 바뀌어도 충돌 처리하며 다른 팀·삭제 이미지 ID를 섞지 못한다. 오류 후 화면에서 사진 새로고침으로 현재 목록을 확인해 다시 시도한다.

형식·용량·파일명 오류는 400 `INVALID_TEAM_IMAGE`, 앱 multipart 초과는 413 `UPLOAD_TOO_LARGE`, 3장 초과는 409 `TEAM_IMAGE_LIMIT_REACHED`다. 인증 누락은 401이며 기존 공통 정책에 따라 권한 없음·없는 리소스는 공통 404로 처리한다.

## 화면·검증·다음 세션

팀 홈의 소개·정보 아래에 모바일 1열·데스크톱 최대 3열로 원본 비율을 유지해 표시한다. 운영진은 원본 파일명·현재 장수, 미리보기·등록·앞으로/뒤로·개별 삭제 확인을 사용한다. 일반 팀원/비로그인은 사진만 조회하며 사진이 없으면 영역을 숨긴다. 업로드 실패 시 선택한 미리보기를 보존한다. 이미지 로드 실패·목록 새로고침 재시도를 제공한다.

- BE 관련 **16개 통과**: TeamImageTest 7개, 기존 TeamLogoStorageTest 4개, AccessErrorResponseTest 3개, FeePaymentLeaveTest 2개. 실제 신규/기존 DDL·저장소 경로·5MB 경계/실형식·권한·정렬 충돌·삭제 조회 차단·동시 마지막 자리·롤백/쓰기 실패 정리를 격리 H2 및 임시 파일로 확인했다. HTTP 파일 테스트의 byte-array 변환기를 보완한 뒤 통과했다.
- FE 기본 **18개**, 린트·프로덕션 빌드(TypeScript 포함) 통과. 375px/1440px × 팀장/부팀장/팀원/비로그인 **8조합** 모의 API·Chrome에서 업로드 검증·실패 입력 보존·최대 장수·정렬 충돌/재시도·삭제 취소/확인·새로고침·공개 조회와 가로 넘침 없음을 확인했다.
- 실제 MySQL DDL·동시성, 실제 Spring 트랜잭션과 파일의 통합 E2E, 실제 JWT/BE 브라우저 연결, 전체 BE 테스트·운영 DB·배포·푸시는 미실행이다. H2 동시성 통과가 MySQL 보장을 검증한 것은 아니다.

사용자 정책은 모두 확정됐다. 후속 작업은 동일 결정을 다시 묻지 않고 [작업 계획](project-improvement-work-plan.md)의 최신 결과와 한계를 따른다. 새 파일·DDL을 실제 운영 DB/폴더에 적용하는 작업은 포함하지 않았다.
