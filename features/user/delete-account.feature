Feature: Eliminación de cuenta de usuario
  Como usuario registrado
  Quiero poder eliminar mi cuenta permanentemente
  Para que mis datos personales sean eliminados del sistema

  Background:
    Given la API está disponible en "http://localhost:3000/api/v1"
    And un usuario registrado con email "user@example.com" y contraseña "Password1!"
    And el usuario ha iniciado sesión y tiene un JWT válido

  Scenario: El usuario elimina su propia cuenta con éxito
    When envío DELETE /users/me con el JWT del usuario
    Then la respuesta tiene status 204
    And el usuario ya no puede autenticarse con sus credenciales originales
    And los tokens de refresco previos han sido revocados

  Scenario: El usuario no puede iniciar sesión después de eliminar su cuenta
    Given el usuario ha eliminado su cuenta
    When envío POST /auth/login con email "user@example.com" y contraseña "Password1!"
    Then la respuesta tiene status 401

  Scenario: Las transacciones compartidas del usuario se preservan tras la eliminación
    Given el usuario participa en un evento con otro usuario
    And el usuario ha eliminado su cuenta
    When consulto el evento como el otro participante
    Then el evento sigue existiendo
    And las transacciones vinculadas al evento siguen visibles

  Scenario: No se puede eliminar una cuenta sin autenticación
    When envío DELETE /users/me sin token de autorización
    Then la respuesta tiene status 401
