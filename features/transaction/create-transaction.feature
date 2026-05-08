Feature: Crear transacción financiera
  Como usuario autenticado
  Quiero registrar una transacción
  Para llevar control de mis finanzas

  Background:
    Given el usuario está autenticado con token válido

  Scenario: Crear gasto diario
    When envío POST /transactions con:
      | campo       | valor         |
      | description | Café          |
      | amount      | 50            |
      | type        | daily         |
      | category    | alimentacion  |
      | quincena    | primera       |
      | dueDay      | 7             |
      | month       | 5             |
      | year        | 2026          |
      | isRecurring | false         |
      | isCC        | false         |
    Then la respuesta tiene status 201
    And la respuesta contiene un campo "id" no vacío
    And la respuesta contiene un campo "status" igual a "confirmed"

  Scenario: Crear gasto programado (queda en pending)
    When envío POST /transactions con type "scheduled"
    Then la respuesta tiene status 201
    And la respuesta contiene un campo "status" igual a "pending"

  Scenario: Crear transacción con monto negativo falla validación
    When envío POST /transactions con amount -100
    Then la respuesta tiene status 400

  Scenario: Crear transacción sin token falla
    Given el usuario NO está autenticado
    When envío POST /transactions con datos válidos
    Then la respuesta tiene status 401

  Scenario: Header x-idempotency-key previene duplicados
    Given el header "x-idempotency-key" es "test-key-123"
    When envío POST /transactions dos veces con los mismos datos
    Then solo se crea una transacción
    And la segunda respuesta tiene los mismos datos que la primera
