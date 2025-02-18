Feature: Link Checker
  As a website owner
  I want to check all links on my website
  So that I can ensure they are working correctly

  Scenario: Check all links on the website
    Given I am on the homepage of the website
    When I check all links on the website
    Then I should see a report of all external links
    And I should see a report of all blog posts
    And I should see a report of all social media links
