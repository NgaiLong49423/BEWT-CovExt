package base;

import static org.junit.Assert.assertEquals;
import org.junit.Test;
import po.BaseNavBar;
import po.ManageProjectPage;
import utils.Strings;

public class UpdateProjectViewStatus extends BaseTest {

        @Test
        public void updateProjectViewStatus() {
                String projectName = "Project001";


                ManageProjectPage manageProj = new BaseNavBar(driver)
                                .manage()
                                .manageProjects()
                                .goToProject(projectName)
                                .setViewState(Strings.visibilityPrivate)
                                .updateProject();

                assertEquals(Strings.visibilityPrivate, manageProj.getProjectVisibility());
                manageProj.logout();
        }
}
