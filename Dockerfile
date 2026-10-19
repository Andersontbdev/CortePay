# Constrói e roda o sistema. Qualquer hospedagem que aceite Dockerfile consegue publicá-lo a partir do GitHub.
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
RUN useradd -m app
COPY --from=build /app/target/*.jar app.jar
USER app
ENV JAVA_OPTS="-Xmx400m"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
