package com.yonghoo.teammanager.oAuth.resolver;

import java.util.Objects;

import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.yonghoo.teammanager.oAuth.annotation.Login;
import com.yonghoo.teammanager.oAuth.entity.User;
import com.yonghoo.teammanager.oAuth.service.OAuthService;

import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class LoginResolver implements HandlerMethodArgumentResolver {
	private final OAuthService oAuthService;

	@Override
	public boolean supportsParameter(MethodParameter parameter) {
		Login paramAnnotation = parameter.getParameterAnnotation(Login.class);
		Class<?> paramType = parameter.getParameterType();
		return Objects.nonNull(paramAnnotation) && paramType.equals(User.class);
	}

	@Override
	public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
		NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {
		String token = oAuthService.getToken(webRequest.getHeader("Authorization"));
		if (oAuthService.verifyToken(token)) {
			return oAuthService.getUserFromToken(token);
		}
		throw new ValidationException("토큰 인증 실패: " + token);
	}
}
