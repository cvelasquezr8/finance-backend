Feature: Resumen de balance financiero
  Como usuario autenticado
  Quiero obtener el resumen de mi balance por quincena
  Para tomar decisiones financieras informadas

  Background:
    Given el usuario está autenticado con token válido

  Scenario: Obtener resumen de balance exitoso
    When envío GET /balance?month=5&year=2026&quincena=primera
    Then la respuesta tiene status 200
    And la respuesta contiene los campos:
      | currentBalance         |
      | initialBalance         |
      | projectedBalance       |
      | dailyAllowance         |
      | totalDebt              |
      | totalPendingScheduled  |
      | totalConfirmedScheduled|
      | totalDailyExpenses     |
      | expectedIncome         |
      | remainingDays          |
      | month                  |
      | year                   |
      | quincena               |

  Scenario: Ajuste de balance persiste historial
    When envío POST /balance/adjust con newBalance 10000 y reason "Corrección inicial"
    Then la respuesta tiene status 201
    And el campo "currentBalance" es mayor a 0
