Feature: Web-Scraping

  Scenario: Get basic page content
    Given I open the browser
    When I visit webpage "https://example.com"
    Then I should get page content
    And close the browser

  Scenario: Save content to file
    Given I open the browser
    When I visit webpage "https://example.com"
    Then I should get page content
    And save content to "output.txt"
    And close the browser

  Scenario Outline: Check multiple pages
    Given I open the browser
    When I visit webpage "<url>"
    Then I should get page content
    And content should contain "<expected_text>"
    And close the browser

    Examples:
      | url                  | expected_text |
      | https://example.com  | Example       |