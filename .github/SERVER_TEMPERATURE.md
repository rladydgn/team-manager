# 서버 온도 모니터링

`Server Temperature Monitor`는 매시간 7분에 SSH로 `LC_ALL=C sensors -j`를 실행합니다.
CPU, NVMe 등 출력에 포함된 실제 온도(`temp*_input`) 중 하나라도 **50°C 초과**이면 Actions를 실패 처리합니다.
50°C 이하는 성공 처리합니다. `max`, `crit`, 팬 속도는 비교하지 않습니다.
온도가 계속 높으면 매시간 실행이 실패합니다. SSH 오류, 센서 미검출, JSON 파싱 오류도 실패 처리합니다.
메일은 GitHub의 기본 Actions 실패 알림을 사용합니다. 별도 SMTP나 수신 이메일 Secrets는 필요하지 않습니다.
실패 원인과 초과한 센서 온도는 실행 로그의 오류 표시에서 확인할 수 있습니다.

## GitHub 이메일 알림

- 개인 **Settings → Notifications → System → Actions**에서 **Email**과 **Only notify for failed workflows**를 선택하세요.
- 메일은 계정의 GitHub 알림 설정에 따른 주소로 전송됩니다. 워크플로에서 주소를 지정하지 않습니다.
- 예약 실행 알림은 cron 구문을 마지막으로 수정한 사용자에게 전달됩니다. 본인 계정으로 이 스케줄을 반영하세요.

공식 안내: [Actions 알림 설정](https://docs.github.com/en/subscriptions-and-notifications/how-tos/managing-github-actions-notifications),
[예약 실행 알림 대상](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#actor-for-scheduled-workflows)

## 서버 준비

- GitHub의 Ubuntu 러너에서 SSH로 접근할 수 있어야 합니다.
- SSH 계정이 암호 입력 없이 지정한 키로 로그인하고 `sensors -j`를 실행할 수 있어야 합니다.
- Ubuntu/Debian에서 센서 명령이 없다면 서버에서 `sudo apt-get install lm-sensors`를 실행하세요.
- 먼저 서버에서 `sensors -j`를 실행해 실제 온도값이 출력되는지 확인하세요.
  EC2 등 가상 서버는 하드웨어 센서를 노출하지 않을 수 있습니다. 센서값이 없으면 이 방식으로 온도를 확인할 수 없습니다.

## GitHub 설정

배포 워크플로(`deploy-ec2.yml`)에서 사용 중인 아래 Secrets와 SSH 포트 22를 그대로 사용합니다.
이미 배포 설정이 되어 있다면 추가 SSH Secrets나 Variables는 필요하지 않습니다.
개인키를 파일에 작성하거나 커밋하지 마세요.

Repository secrets:

| 이름 | 값 |
| --- | --- |
| `SERVER_HOST` | 서버 IP 또는 호스트명. 기존 배포 설정 재사용 |
| `SERVER_USER` | SSH 사용자. 기존 배포 설정 재사용 |
| `SERVER_SSH_KEY` | SSH 개인키 전체. 기존 배포 설정 재사용 |

서버 호스트 키는 `StrictHostKeyChecking=accept-new`로 첫 연결 시 자동 등록합니다.
known_hosts 파일은 실행마다 임시로 생성되므로 실행 간 호스트 키 변경은 검증하지 않습니다.

## 활성화 및 확인

1. 워크플로와 스크립트를 저장소의 기본 브랜치에 반영하고 위 설정을 등록합니다.
2. **Actions → Server Temperature Monitor → Run workflow**에서 수동 실행해 실제 서버 온도를 확인합니다.
3. 이후 매시간 7분에 실행됩니다. GitHub 스케줄은 부하에 따라 지연될 수 있으며 정확한 실행 시각은 보장되지 않습니다.
   공개 저장소는 60일간 활동이 없으면 스케줄이 비활성화될 수 있습니다.

스케줄 관련 조건: [GitHub 공식 문서](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

