plugins {
	java
	id ("org.springframework.boot") version "3.4.2"
	id ("io.spring.dependency-management") version "1.1.7"
}

group = "com.yonghoo"
version = "0.0.1-SNAPSHOT"

java {
	sourceCompatibility = JavaVersion.VERSION_21
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-web")
	testImplementation("org.springframework.boot:spring-boot-starter-test")

	// DB
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	runtimeOnly("com.mysql:mysql-connector-j")

	// lombok
	compileOnly("org.projectlombok:lombok")
	annotationProcessor("org.projectlombok:lombok")

	// dto validator
	implementation("org.springframework.boot:spring-boot-starter-validation")

	// spring doc
	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.5.0")

	// jwt token
	implementation("io.jsonwebtoken:jjwt-api:0.12.6")
	implementation("io.jsonwebtoken:jjwt-impl:0.12.6")
	implementation("io.jsonwebtoken:jjwt-jackson:0.12.6")
}

tasks.withType<Test> {
	useJUnitPlatform()
}
