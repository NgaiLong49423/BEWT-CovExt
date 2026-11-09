package base;

import org.junit.runner.RunWith;
import org.junit.runners.Suite;
import org.junit.runners.Suite.SuiteClasses;

@RunWith(Suite.class)
@SuiteClasses({
        AddUser.class,
        AddExistingUserFails.class,
        AddEmptyUserFails.class,
        AddProject.class,
        AddExistingProjectFails.class,
        AddCategory.class,
        AddExistingCategoryFails.class,
        AddIssue.class,
        AssignIssue.class,
        UpdateIssuePriority.class,
        UpdateIssueSeverity.class,
        UpdateIssueStatusAcknowledged.class,
        UpdateIssueStatusAssigned.class,
        UpdateIssueStatusConfirmed.class,
        UpdateIssueStatusFeedback.class,
        UpdateIssueStatusNew.class,
        UpdateIssueStatusResolved.class,
        UpdateIssueSummary.class,
        UpdateProjectStatus.class,
        UpdateProjectDescription.class,
        UpdateProjectViewStatus.class,
        UpdateCategory.class,
        UpdateCategoryEmpty.class,
        UpdateUser.class,
        UpdateUserEmpty.class,
        DeleteIssue.class,
        DeleteCategory.class,
        DeleteProject.class,
        DeleteUser.class,
        BadLogin.class,
        AddMultipleUsers.class,
        DeleteMultipleUsers.class,
        AddMultipleSubprojects.class,
        UnlinkMultipleSubprojects.class,
        LinkMultipleSubprojects.class,
        DeleteMultipleProjects.class,
        Logout.class,
})
public class TestSuite {}
