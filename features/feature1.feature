Feature: Header Navigation Test
  As a user
  I want to verify all header navigation links
  So that I can ensure they are correct and working

  Scenario: Verify header navigation items and their links
    Given I am on the homepage
    When I check the header navigation
    Then I should see "<nav_item>" in the header
    And the link for "<nav_item>" should point to "<expected_url>"

    Examples:
      | nav_item       | expected_url           |
      | Home          | /                      |
      | About         | /about                 |
      | Services      | /services              |
      | Blogs         | /blogs                 |
      | Clients       | /clients               |
      | Privacy Policy| /privacy-policy        |
      | Contact Us    | /contact               |

  Scenario: Verify all navigation items are present
    Given I am on the homepage
    When I check the header navigation
    Then I should see all required navigation items