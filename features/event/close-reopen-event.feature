Feature: Cierre y reapertura de eventos de presupuesto
  Como creador de un evento
  Quiero poder cerrar y reabrir eventos
  Para controlar el ciclo de vida del presupuesto compartido

  Background:
    Given la API está disponible en "http://localhost:3000/api/v1"
    And un usuario "creator" ha iniciado sesión y tiene un JWT válido
    And existe un evento ACTIVE con id "e1" creado por "creator"
    And "bob" es un participante CONFIRMED en el evento "e1"

  # ─── Cierre de evento ────────────────────────────────────────────────────

  Scenario: El creador cierra un evento activo con éxito
    When envío PATCH /events/e1/close con el JWT de "creator"
    Then la respuesta tiene status 200
    And el campo "status" en la respuesta es "COMPLETED"

  Scenario: Un administrador puede cerrar cualquier evento
    Given un usuario "admin" con role ADMIN ha iniciado sesión
    When envío PATCH /events/e1/close con el JWT de "admin"
    Then la respuesta tiene status 200
    And el campo "status" en la respuesta es "COMPLETED"

  Scenario: Un participante no puede cerrar el evento
    Given un usuario "bob" ha iniciado sesión
    When envío PATCH /events/e1/close con el JWT de "bob"
    Then la respuesta tiene status 403

  Scenario: No se puede cerrar un evento que ya está cerrado
    Given el evento "e1" tiene status "COMPLETED"
    When envío PATCH /events/e1/close con el JWT de "creator"
    Then la respuesta tiene status 403

  Scenario: El cierre de evento notifica a los participantes confirmados
    When envío PATCH /events/e1/close con el JWT de "creator"
    Then se genera una notificación de tipo "event_closed" para "bob"

  Scenario: Las transacciones del evento no aparecen en el listado regular tras el cierre
    Given el evento "e1" tiene una transacción vinculada
    When envío PATCH /events/e1/close con el JWT de "creator"
    And consulto GET /transactions?month=6&year=2026 con el JWT de "creator"
    Then la transacción del evento no aparece en los resultados

  # ─── Reapertura de evento ────────────────────────────────────────────────

  Scenario: El creador reabre un evento cerrado con éxito
    Given el evento "e1" tiene status "COMPLETED"
    When envío PATCH /events/e1/reopen con el JWT de "creator"
    Then la respuesta tiene status 200
    And el campo "status" en la respuesta es "ACTIVE"

  Scenario: No se puede reabrir un evento que ya está activo
    When envío PATCH /events/e1/reopen con el JWT de "creator"
    Then la respuesta tiene status 403

  Scenario: El participante no puede reabrir el evento
    Given el evento "e1" tiene status "COMPLETED"
    Given un usuario "bob" ha iniciado sesión
    When envío PATCH /events/e1/reopen con el JWT de "bob"
    Then la respuesta tiene status 403

  Scenario: Las transacciones vuelven a aparecer en el listado tras reabrir el evento
    Given el evento "e1" tiene status "COMPLETED"
    And el evento "e1" tiene una transacción vinculada
    When envío PATCH /events/e1/reopen con el JWT de "creator"
    And consulto GET /transactions?month=6&year=2026 con el JWT de "creator"
    Then la transacción del evento aparece en los resultados
