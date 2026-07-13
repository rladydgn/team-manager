package com.yonghoo.team_manager.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfig {
    @Bean
    fun openAPI(): OpenAPI {
        return OpenAPI()
            .info(
                Info()
                    .title("Team Manager API")
                    .description("축구 팀 관리 서비스 API 명세")
                    .version("v1"),
            )
    }
}
