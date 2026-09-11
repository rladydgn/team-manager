package com.yonghoo.team_manager.user.oauth

import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.client.RestClient

@Configuration
@EnableConfigurationProperties(KakaoOAuthProperties::class)
class KakaoOAuthConfig {
    @Bean
    fun restClientBuilder(): RestClient.Builder = RestClient.builder()
}
