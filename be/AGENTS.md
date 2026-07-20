# Project Overview

This project is Team Manager, a football team management service for member management, match schedules, match records, match participation, guest players, and membership fee management.

This backend project follows the Spec-Driven Development workflow from Paul Everitt's DeepLearning.AI short course:
https://www.deeplearning.ai/courses/spec-driven-development-with-coding-agents

Use the local SDD files under `specs/` before implementing changes:

- `specs/constitution.md` defines the backend development principles.
- `specs/mission.md` defines the product and backend mission.
- `specs/tech-stack.md` defines the accepted backend stack and architecture.
- `specs/roadmap.md` defines the planned backend phases.
- `specs/workflow.md` defines the project workflow: constitution, feature spec, implementation, validation, replanning, legacy support, and workflow improvement.
- `specs/features/_template/` contains the feature-spec document set to copy for new backend features.

Create or update SDD documents only when the user explicitly requests them.

The backend should model football team operations clearly:

- Users are service accounts that can log in.
- Team members are people who belong to a team and may or may not have a service account.
- Team members can include owners, sub-managers, regular members, and guests.
- Matches are created by a team and can be external matches or internal matches.
- For external matches, opponent teams may be registered in the service or entered as plain text.
- Internal-match participants are assigned to the home or away side.
- In external matches, the creating team is the home side; for internal matches, home and away identify the two teams formed from that team's members.
- Match records and match participants are separate from the match schedule itself.

# Backend Stack

- Kotlin + Spring Boot.
- Exposed is the ORM.
- Use `exposed-spring-boot-starter` and Spring `@Transactional` boundaries.
- Keep packages organized by domain such as `user`, `team`, and future `match`.
- Follow the existing controller/service/repository/domain/dto/exception style.

# API Rules

- Controllers should stay thin.
- Put business rules in services.
- Put Exposed persistence logic in repositories.
- Use `CommonResponse` for successful responses unless the project standard changes.
- Use `ApiException` with domain-specific `ErrorCode` enums for expected failures.
- For Springdoc, keep controller annotations minimal; prefer `@Operation` only unless more detail is explicitly requested.
- Authentication uses an HttpOnly JWT access-token cookie. Validate it in a Spring MVC interceptor and derive the acting user ID from the request attribute, never from a client-supplied user ID.
- Read the JWT signing secret from the `JWT_SECRET` environment variable; never commit a secret to source control.
- Keep access and refresh tokens in HttpOnly cookies only. Access tokens expire after 15 minutes, while refresh tokens expire after 7 days. Set both cookies to `SameSite=Lax` by default and use `Secure` in HTTPS environments.

# Schema Rules

- Keep date/time columns in `~_at` form, such as `created_at`, `updated_at`, `deleted_at`, `last_login_at`, and `match_at`.
- Use soft delete columns with `deleted_at` where deletion may need to preserve history.
- Do not add unique keys to schema definitions.
- Do not rely on database uniqueness for business rules; enforce those rules in service logic.
- Prefer indexes for query performance where needed.
- Avoid foreign key constraints in schema definitions; keep relationship columns and validate references in application logic.
- Avoid database-level `CHECK` constraints and other business-rule constraints; validate those rules in service logic.
- Allow `team_members.user_id` to be nullable so non-registered players and guest players can be managed.
- Validate match type and opponent information in application logic: external matches use an opponent team ID or name, while internal matches do not.
- Keep schema changes conservative and aligned with current MySQL-style SQL unless the database choice changes.
- Append existing-database schema change DDL to `src/main/resources/change_schema.sql`; do not create separate migration files unless the user requests one.
