package com.yonghoo.team_manager.user.config

import com.yonghoo.team_manager.user.auth.JwtAuthenticationInterceptor
import com.yonghoo.team_manager.user.auth.JwtProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
@EnableConfigurationProperties(JwtProperties::class)
class JwtWebConfig(
    private val jwtAuthenticationInterceptor: JwtAuthenticationInterceptor,
) : WebMvcConfigurer {
    override fun addInterceptors(registry: InterceptorRegistry) {
        registry.addInterceptor(jwtAuthenticationInterceptor).addPathPatterns("/**")
    }
}
