Feature: Autenticación de usuario
  Como usuario registrado
  Quiero poder iniciar sesión con mi email y contraseña
  Para acceder a mi información financiera

  Background:
    Given la API está disponible en "http://localhost:3000/api/v1"

  Scenario: Login exitoso con credenciales válidas
    Given un usuario registrado con email "test@example.com" y contraseña "password123"
    When envío POST /auth/login con email "test@example.com" y contraseña "password123"
    Then la respuesta tiene status 200
    And la respuesta contiene un campo "token" no vacío
    And la respuesta contiene un campo "refreshToken" no vacío
    And la respuesta contiene un objeto "user" con campo "email" igual a "test@example.com"

  Scenario: Login fallido con contraseña incorrecta
    Given un usuario registrado con email "test@example.com" y contraseña "password123"
    When envío POST /auth/login con email "test@example.com" y contraseña "wrong"
    Then la respuesta tiene status 401
    And la respuesta contiene un campo "code" igual a "HTTP_401"

  Scenario: Login fallido con usuario no existente
    When envío POST /auth/login con email "ghost@example.com" y contraseña "password123"
    Then la respuesta tiene status 401
